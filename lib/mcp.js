import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const VALID_DIMENSIONS = [
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
];

const VALID_DIMENSIONS_SET = new Set(VALID_DIMENSIONS);

/**
 * Computes label as hostname plus first path segment.
 * E.g., https://mcp.smithery.ai/flight-search/v1 -> mcp.smithery.ai/flight-search
 */
function getLabelFromAddress(address) {
  try {
    const url = new URL(address);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      return `${url.hostname}/${pathSegments[0]}`;
    }
    return url.hostname;
  } catch {
    return address;
  }
}

export const DEFAULT_MCP_SERVERS =
  "visa|destination=https://server.smithery.ai/albert-dwqs/viatsy-mcp," +
  "stays=https://server.smithery.ai/google/hotels," +
  "flights|routes=https://server.smithery.ai/kiwi," +
  "budget|stays=https://server.smithery.ai/shokjak/travel-deals-mcp," +
  "cost_exchange|budget=https://server.smithery.ai/stockvibes07/exchange-mcp," +
  "weather=https://server.smithery.ai/vdineshk/sg-weather-data-mcp," +
  "routes|transport|places=https://server.smithery.ai/cyanheads/openstreetmap-mcp-server," +
  "weather=https://server.smithery.ai/isdaniel/mcp_weather_server," +
  "stays=https://server.smithery.ai/moodtrip/moodtrip-hotel-search," +
  "destination|places|flights|visa=https://server.smithery.ai/sorted-travel/destinations," +
  "places|destination|stays=https://server.smithery.ai/tripadvisor/search";

/**
 * Reads process.env.MCP_SERVERS as a comma-separated list.
 * Each entry is "dims=address", where dims is one or more dimension names joined by "|".
 * Trims every part. Ignores unknown dimension names and logs a warning for them without the address.
 * Returns [{ dims, address, label }].
 */
export function parseServers() {
  const envVal = process.env.MCP_SERVERS || DEFAULT_MCP_SERVERS;
  if (!envVal || typeof envVal !== "string") {
    return [];
  }

  const entries = envVal.split(",");
  const servers = [];

  for (const rawEntry of entries) {
    const entry = rawEntry.trim();
    if (!entry) continue;

    const eqIndex = entry.indexOf("=");
    if (eqIndex === -1) continue;

    const dimsPart = entry.slice(0, eqIndex).trim();
    const address = entry.slice(eqIndex + 1).trim();

    if (!address) continue;

    const rawDims = dimsPart.split("|").map((d) => d.trim()).filter(Boolean);
    const validDims = [];

    for (const d of rawDims) {
      if (VALID_DIMENSIONS_SET.has(d)) {
        validDims.push(d);
      } else {
        // Log warning for unknown dimension without the address
        console.warn(`Unknown dimension: ${d}`);
      }
    }

    if (validDims.length === 0) {
      continue;
    }

    const label = getLabelFromAddress(address);
    servers.push({
      dims: validDims,
      address,
      label,
    });
  }

  return servers;
}

/**
 * Connects all given servers in parallel with Promise.allSettled.
 * Returns { clients: [{ client, label, dims, toolNames }], unavailable: [{ label, address, reason }] }.
 */
export async function connectServers(servers = []) {
  if (!Array.isArray(servers) || servers.length === 0) {
    return { clients: [], unavailable: [] };
  }

  const results = await Promise.allSettled(
    servers.map(async (server) => {
      const { dims, address, label } = server;

      let url;
      try {
        url = new URL(address);
      } catch (err) {
        throw new Error(`Invalid server address URL: ${err.message}`);
      }

      const headers = {};
      if (
        (url.hostname === "smithery.ai" || url.hostname.endsWith(".smithery.ai")) &&
        process.env.SMITHERY_API_KEY
      ) {
        headers["Authorization"] = `Bearer ${process.env.SMITHERY_API_KEY}`;
      }

      const client = new Client(
        { name: "travel-planner-agent", version: "1.0.0" },
        { capabilities: {} }
      );

      const transport = new StreamableHTTPClientTransport(url, {
        requestInit: {
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        },
      });

      // 8-second timeout promise
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error("Connection timed out after 8 seconds"));
        }, 8000);
        if (timeoutHandle.unref) timeoutHandle.unref();
      });

      const connectAndFetchTools = async () => {
        try {
          await client.connect(transport);
          const toolsRes = await client.listTools();
          const toolNames = (toolsRes?.tools || []).map((t) => t.name);
          return { client, label, dims, toolNames };
        } finally {
          clearTimeout(timeoutHandle);
        }
      };

      return await Promise.race([connectAndFetchTools(), timeoutPromise]);
    })
  );

  const clients = [];
  const unavailable = [];

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    const server = servers[i];
    if (res.status === "fulfilled") {
      clients.push(res.value);
    } else {
      unavailable.push({
        label: server.label,
        address: server.address,
        reason: res.reason?.message || "Connection failed",
      });
    }
  }

  return { clients, unavailable };
}

/**
 * Closes every client, ignoring errors.
 */
export async function closeAll(clients) {
  if (!Array.isArray(clients)) return;
  await Promise.allSettled(
    clients.map(async (c) => {
      try {
        const clientInstance = c?.client || c;
        if (clientInstance && typeof clientInstance.close === "function") {
          await clientInstance.close();
        }
      } catch {
        // ignore errors
      }
    })
  );
}

/**
 * Builds one entry per functionCall part in response.automaticFunctionCallingHistory,
 * in order, with name, args, the label of the server whose toolNames contains that name,
 * and failed: true when the matching functionResponse contains an error.
 */
export function buildToolCalls(response, clients = []) {
  const history = response?.automaticFunctionCallingHistory;
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  // Create lookup map from tool name to server label
  const toolToServerLabel = new Map();
  for (const c of clients) {
    if (Array.isArray(c.toolNames)) {
      for (const tName of c.toolNames) {
        toolToServerLabel.set(tName, c.label);
      }
    }
  }

  const toolCalls = [];

  for (let i = 0; i < history.length; i++) {
    const msg = history[i];
    if (!Array.isArray(msg?.parts)) continue;

    for (let pIdx = 0; pIdx < msg.parts.length; pIdx++) {
      const part = msg.parts[pIdx];
      if (part?.functionCall) {
        const { name, args } = part.functionCall;
        const label = toolToServerLabel.get(name) || "unknown";

        // Find matching response in subsequent messages
        let failed = false;
        let foundResponse = false;

        for (let j = i + 1; j < history.length; j++) {
          const nextMsg = history[j];
          if (!Array.isArray(nextMsg?.parts)) continue;

          for (const nextPart of nextMsg.parts) {
            if (
              nextPart?.functionResponse &&
              (nextPart.functionResponse.name === name ||
                (part.functionCall.id &&
                  nextPart.functionResponse.id === part.functionCall.id))
            ) {
              foundResponse = true;
              const resData = nextPart.functionResponse.response;
              if (resData) {
                if (
                  resData.error != null ||
                  resData.isError === true ||
                  (typeof resData === "object" && resData.status === "error")
                ) {
                  failed = true;
                } else if (
                  typeof resData === "string" &&
                  resData.toLowerCase().startsWith("error")
                ) {
                  failed = true;
                }
              }
              break;
            }
          }
          if (foundResponse) break;
        }

        toolCalls.push({
          name,
          args: args || {},
          label,
          server: label,
          failed,
        });
      }
    }
  }

  return toolCalls;
}
