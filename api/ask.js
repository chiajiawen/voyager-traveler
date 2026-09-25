import { GoogleGenAI, mcpToTool } from "@google/genai";
import {
  parseServers,
  connectServers,
  closeAll,
  buildToolCalls,
  VALID_DIMENSIONS,
} from "../lib/mcp.js";

function validateBody(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be an object";
  }

  const { question, context, history } = body;

  // question: required string, 1 to 500 chars
  if (
    typeof question !== "string" ||
    question.trim().length === 0 ||
    question.length > 500
  ) {
    return "question is required and must be between 1 and 500 characters";
  }

  // context: optional object
  if (context !== undefined && context !== null) {
    if (typeof context !== "object" || Array.isArray(context)) {
      return "context must be an object";
    }

    if (context.origin_city !== undefined && context.origin_city !== null) {
      if (
        typeof context.origin_city !== "string" ||
        context.origin_city.length > 80
      ) {
        return "origin_city in context must be a string up to 80 characters";
      }
    }

    if (context.budget !== undefined && context.budget !== null) {
      if (
        typeof context.budget !== "number" ||
        isNaN(context.budget) ||
        context.budget <= 0
      ) {
        return "budget in context must be a number greater than 0";
      }
    }

    if (context.currency !== undefined && context.currency !== null) {
      if (
        typeof context.currency !== "string" ||
        !/^[a-zA-Z]{3}$/.test(context.currency.trim())
      ) {
        return "currency in context must be a 3-letter ISO code";
      }
    }

    if (
      context.start_date !== undefined &&
      context.start_date !== null &&
      context.end_date !== undefined &&
      context.end_date !== null
    ) {
      const start = new Date(context.start_date);
      const end = new Date(context.end_date);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "start_date and end_date in context must be valid ISO dates";
      }
      if (end <= start) {
        return "end_date in context must be after start_date";
      }
      const tripDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (tripDays > 30) {
        return "trip duration in context must be at most 30 days";
      }
    }

    if (context.travellers !== undefined && context.travellers !== null) {
      if (
        !Number.isInteger(context.travellers) ||
        context.travellers < 1 ||
        context.travellers > 10
      ) {
        return "travellers in context must be an integer between 1 and 10";
      }
    }

    if (context.nationality !== undefined && context.nationality !== null) {
      if (
        typeof context.nationality !== "string" ||
        context.nationality.length > 60
      ) {
        return "nationality in context must be a string up to 60 characters";
      }
    }

    if (context.destination !== undefined && context.destination !== null) {
      if (
        typeof context.destination !== "string" ||
        context.destination.length > 80
      ) {
        return "destination in context must be a string up to 80 characters";
      }
    }
  }

  // history: optional array of at most 6 { role: "user" | "model", text } turns, each text max 1000 chars
  if (history !== undefined && history !== null) {
    if (!Array.isArray(history)) {
      return "history must be an array";
    }
    if (history.length > 6) {
      return "history must contain at most 6 turns";
    }
    for (const turn of history) {
      if (
        !turn ||
        typeof turn !== "object" ||
        (turn.role !== "user" && turn.role !== "model") ||
        typeof turn.text !== "string" ||
        turn.text.length > 1000
      ) {
        return "each history turn must have role ('user' | 'model') and text up to 1000 characters";
      }
    }
  }

  return null;
}

const routerSchema = {
  type: "OBJECT",
  properties: {
    dimensions: {
      type: "ARRAY",
      items: {
        type: "STRING",
        enum: [
          "budget",
          "destination",
          "cost_exchange",
          "flights",
          "stays",
          "places",
          "weather",
          "routes",
          "transport",
          "visa",
        ],
      },
      description: "Travel dimensions needed to answer the question",
    },
    destination: {
      type: "STRING",
      nullable: true,
      description: "Destination if identified",
    },
    in_scope: {
      type: "BOOLEAN",
      description: "Whether the question is related to travel",
    },
    clarifying_question: {
      type: "STRING",
      nullable: true,
      description: "A single clarifying question if needed, or null",
    },
  },
  required: ["dimensions", "in_scope"],
};

export default async function handler(req, res) {
  // 4) Check GEMINI_API_KEY before anything else
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not set. Add it in Vercel and redeploy.",
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  // Parse body if raw string
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON in request body" });
    }
  }

  // 5) Validate body
  const validationError = validateBody(body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { question, context, history } = body;

  const ai = new GoogleGenAI({ apiKey });
  let connectedClients = [];

  try {
    // 6) Routing before any MCP connection
    let routerResult = null;
    let routing_fallback = false;

    const routerContents = [
      {
        role: "user",
        parts: [
          {
            text: `Determine travel dimensions needed to answer the user question.
${context ? `Trip Context: ${JSON.stringify(context)}\n` : ""}${
              history && history.length > 0
                ? `Conversation History:\n${history
                    .map((h) => `${h.role}: ${h.text}`)
                    .join("\n")}\n`
                : ""
            }Question: ${question}`,
          },
        ],
      },
    ];

    try {
      const routerResponse = await ai.models.generateContent({
        model,
        contents: routerContents,
        config: {
          systemInstruction:
            "pick every dimension needed to answer the question; use context and history to resolve words like \"there\" or \"my budget\"; set in_scope false for questions not about travel; ask one clarifying_question only if the question cannot be answered without it (e.g. no destination for a weather question and none in context).",
          responseMimeType: "application/json",
          responseSchema: routerSchema,
        },
      });

      let rawText = routerResponse?.text?.trim() || "";
      if (rawText.startsWith("```")) {
        rawText = rawText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
      }
      routerResult = JSON.parse(rawText);
    } catch {
      routing_fallback = true;
    }

    if (!routing_fallback && routerResult) {
      if (routerResult.in_scope === false) {
        return res.status(200).json({
          answer: "I can only help with travel planning questions.",
          routed_to: [],
          tool_calls: [],
        });
      }

      if (routerResult.clarifying_question) {
        return res.status(200).json({
          answer: routerResult.clarifying_question,
          needs_clarification: true,
          routed_to: routerResult.dimensions || [],
          tool_calls: [],
        });
      }
    }

    const allServers = parseServers();
    let dimensions = routerResult?.dimensions || [];
    let selectedServers = [];
    let not_covered = [];

    if (routing_fallback || !routerResult) {
      routing_fallback = true;
      selectedServers = allServers;
      dimensions = VALID_DIMENSIONS;
    } else {
      const chosenDimsSet = new Set(dimensions);
      selectedServers = allServers.filter((s) =>
        s.dims.some((d) => chosenDimsSet.has(d))
      );

      const coveredDims = new Set(selectedServers.flatMap((s) => s.dims));
      not_covered = dimensions.filter((d) => !coveredDims.has(d));
    }

    // Connect selected servers
    const conn = await connectServers(selectedServers);
    connectedClients = conn.clients;
    const unavailable = conn.unavailable;

    if (connectedClients.length === 0) {
      return res.status(503).json({
        error: "None of the selected MCP servers are currently available.",
        unavailable,
        not_covered,
      });
    }

    // 7) Answering with selected MCP tools
    const clientInstances = connectedClients.map((c) => c.client);
    const tools = [mcpToTool(...clientInstances)];

    const systemInstruction = `Answer only from tool results; never use prior knowledge for prices, rates, schedules, weather or visa rules.
Give the source tool and fetched_at time for every figure (or "time not given").
Convert costs into context.currency when given, using a rate from an exchange-rate tool, and state the rate.
If a tool errors or returns nothing, say so in one sentence and do not guess. If a needed dimension is in not_covered, say that this app cannot check it yet.
Visa or entry answers end with "Confirm with the official immigration authority before booking."
At most 150 words, plain text with short bullet points where useful.`;

    const contents = [];
    if (context && Object.keys(context).length > 0) {
      contents.push({
        role: "user",
        parts: [{ text: `Trip Context:\n${JSON.stringify(context, null, 2)}` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "Understood. I will reference this trip context." }],
      });
    }

    if (Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "model" ? "model" : "user",
          parts: [{ text: h.text }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: question }],
    });

    const answerResponse = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools,
        automaticFunctionCalling: { maximumRemoteCalls: 8 },
      },
    });

    const tool_calls = buildToolCalls(answerResponse, connectedClients);
    const servers_used = connectedClients.map((c) => c.label);

    return res.status(200).json({
      answer: answerResponse.text,
      routed_to: dimensions,
      servers_used,
      not_covered,
      routing_fallback,
      tool_calls,
      unavailable,
      model,
      answered_at: new Date().toISOString(),
    });
  } catch (geminiError) {
    // 9) Return 502 with status and a one-line reason
    const statusCode = geminiError.status || 502;
    const message = geminiError.message || "Gemini service encountered an error";
    const oneLineReason = message.replace(/\r?\n/g, " ").slice(0, 200);
    return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 502).json({
      error: `Gemini failure (${statusCode}): ${oneLineReason}`,
      status: statusCode,
    });
  } finally {
    // 9) Call closeAll in a finally block
    await closeAll(connectedClients);
  }
}
