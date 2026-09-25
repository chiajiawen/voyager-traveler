import { GoogleGenAI, mcpToTool } from "@google/genai";
import {
  parseServers,
  connectServers,
  closeAll,
  buildToolCalls,
} from "../lib/mcp.js";

function validatePlanBody(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be an object";
  }

  const {
    origin_city,
    budget,
    currency,
    start_date,
    end_date,
    travellers,
    nationality,
    destination,
    preferences,
  } = body;

  // origin_city: required string, max 80 chars
  if (
    !origin_city ||
    typeof origin_city !== "string" ||
    !origin_city.trim() ||
    origin_city.length > 80
  ) {
    return "origin_city is required and must be a string up to 80 characters";
  }

  // budget: required number greater than 0
  if (typeof budget !== "number" || isNaN(budget) || budget <= 0) {
    return "budget is required and must be a number greater than 0";
  }

  // currency: required 3-letter ISO code, default "SGD"
  const curr = currency || "SGD";
  if (typeof curr !== "string" || !/^[a-zA-Z]{3}$/.test(curr.trim())) {
    return "currency must be a 3-letter ISO code";
  }

  // start_date, end_date: required ISO dates, end after start, trip at most 30 days
  if (!start_date || !end_date) {
    return "start_date and end_date are required ISO dates";
  }
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "start_date and end_date must be valid ISO dates";
  }
  if (end <= start) {
    return "end_date must be after start_date";
  }
  const tripDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (tripDays > 30) {
    return "trip duration must be at most 30 days";
  }

  // travellers: integer 1 to 10
  if (
    travellers === undefined ||
    travellers === null ||
    !Number.isInteger(travellers) ||
    travellers < 1 ||
    travellers > 10
  ) {
    return "travellers is required and must be an integer between 1 and 10";
  }

  // nationality: required string, max 60 chars
  if (
    !nationality ||
    typeof nationality !== "string" ||
    !nationality.trim() ||
    nationality.length > 60
  ) {
    return "nationality is required and must be a string up to 60 characters";
  }

  // destination: optional string, max 80 chars
  if (
    destination !== undefined &&
    destination !== null &&
    destination !== "" &&
    (typeof destination !== "string" || destination.length > 80)
  ) {
    return "destination must be a string up to 80 characters";
  }

  // preferences: optional string, max 300 chars
  if (
    preferences !== undefined &&
    preferences !== null &&
    (typeof preferences !== "string" || preferences.length > 300)
  ) {
    return "preferences must be a string up to 300 characters";
  }

  return null;
}

export default async function handler(req, res) {
  // 4) Check GEMINI_API_KEY before anything else
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not set. Add it in Vercel and redeploy.",
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON in request body" });
    }
  }

  // 8) Validate body
  const validationError = validatePlanBody(body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const {
    origin_city,
    budget,
    currency = "SGD",
    start_date,
    end_date,
    travellers,
    nationality,
    destination,
    preferences,
  } = body;

  const userCurrency = currency.toUpperCase().trim();
  const allServers = parseServers();
  let connectedClients = [];

  try {
    // Connect all servers (no routing)
    const conn = await connectServers(allServers);
    connectedClients = conn.clients;
    const unavailable = conn.unavailable;

    if (connectedClients.length === 0) {
      return res.status(503).json({
        error: "None of the MCP servers are currently available to generate a plan.",
        unavailable,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const clientInstances = connectedClients.map((c) => c.client);
    const tools = [mcpToTool(...clientInstances)];

    const systemInstruction = `Answer only from tool results; never use prior knowledge for prices, rates, schedules, weather or visa rules.
Give the source tool and fetched_at time for every figure (or "time not given").
Convert costs into user currency (${userCurrency}), using a rate from an exchange-rate tool, and state the rate.
If a tool errors or returns nothing, say so in one sentence and do not guess. If a needed dimension is not covered, state that clearly.
Visa or entry answers end with "Confirm with the official immigration authority before booking."
Reply with a single JSON object only, no markdown fences, shaped:
{
  "destinations": [
    {
      "name": "Destination Name",
      "fits_budget": true,
      "dimensions": {
        "budget": { "text": "up to 60 words", "status": "ok" },
        "destination": { "text": "up to 60 words", "status": "ok" },
        "cost_exchange": { "text": "up to 60 words", "status": "ok" },
        "flights": { "text": "up to 60 words", "status": "ok" },
        "stays": { "text": "up to 60 words", "status": "ok" },
        "places": { "text": "up to 60 words", "status": "ok" },
        "weather": { "text": "up to 60 words", "status": "ok" },
        "routes": { "text": "up to 60 words", "status": "ok" },
        "transport": { "text": "up to 60 words", "status": "ok" },
        "visa": { "text": "up to 60 words", "status": "ok" }
      },
      "line_items": [
        {
          "item": "Flight ticket / Hotel / Transit / Entry",
          "amount": 150.0,
          "currency": "${userCurrency}",
          "source": "tool_name",
          "fetched_at": "timestamp or time not given"
        }
      ]
    }
  ],
  "summary": "at most 80 words summary"
}
Ensure each dimension has status "ok", "no_data", or "error".
Ensure line_items amount is a numeric value in ${userCurrency}.`;

    const userPrompt = `Generate a full travel plan across all ten dimensions:
- Origin: ${origin_city}
- Budget: ${budget} ${userCurrency}
- Dates: ${start_date} to ${end_date}
- Travellers: ${travellers}
- Nationality: ${nationality}
${
  destination && destination.trim()
    ? `- Destination: ${destination.trim()}`
    : "- Destination: Not specified. Shortlist up to 3 destinations that fit the budget using MCP tool searches."
}
${preferences && preferences.trim() ? `- Preferences: ${preferences.trim()}` : ""}`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        tools,
        automaticFunctionCalling: { maximumRemoteCalls: 15 },
      },
    });

    const tool_calls = buildToolCalls(response, connectedClients);

    let rawText = response?.text || "";
    let cleanText = rawText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
    }

    let plan;
    let parse_error = false;
    try {
      plan = JSON.parse(cleanText);
    } catch {
      parse_error = true;
      plan = {
        destinations: [],
        summary: rawText.slice(0, 500) || "Unable to parse JSON plan output from model.",
        parse_error: true,
      };
    }

    if (!parse_error && plan && Array.isArray(plan.destinations)) {
      for (const dest of plan.destinations) {
        const modelClaim = dest.fits_budget;
        let computedTotal = 0;

        if (Array.isArray(dest.line_items)) {
          for (const item of dest.line_items) {
            const amt = Number(item.amount);
            if (!isNaN(amt)) {
              computedTotal += amt;
            }
          }
        }

        dest.computed_total = Math.round(computedTotal * 100) / 100;
        dest.fits_budget = computedTotal <= budget;
        if (dest.fits_budget !== modelClaim) {
          dest.model_claim_fits_budget = modelClaim;
        }
      }
    }

    return res.status(200).json({
      plan,
      tool_calls,
      unavailable,
      model,
      answered_at: new Date().toISOString(),
    });
  } catch (geminiError) {
    // 9) Return 502 with its status and a one-line reason
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
