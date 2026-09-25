import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  parseServers,
  parseServerString,
  DEFAULT_MCP_SERVERS,
  VALID_DIMENSIONS,
} from "../lib/mcp.js";

/**
 * Returns merged list of all unique servers (env servers + default 11 servers)
 */
function getAllServers() {
  const envServers = parseServers();
  const defaultServers = parseServerString(DEFAULT_MCP_SERVERS);

  const seen = new Set();
  const merged = [];

  for (const s of [...envServers, ...defaultServers]) {
    if (!seen.has(s.address)) {
      seen.add(s.address);
      merged.push(s);
    }
  }

  return merged;
}

/**
 * Tests connection to a single MCP server.
 */
async function testSingleServer(server, smitheryKey) {
  const start = Date.now();
  const timeoutMs = 6000;

  try {
    const parsedUrl = new URL(server.address);
    const headers = {};
    const key = smitheryKey || process.env.SMITHERY_API_KEY;

    if (
      key &&
      (parsedUrl.hostname.includes("smithery.ai") ||
        parsedUrl.hostname.includes("server.smithery.ai"))
    ) {
      headers["Authorization"] = `Bearer ${key}`;
    }

    const transport = new StreamableHTTPClientTransport(parsedUrl, {
      requestInit: { headers },
    });

    const client = new Client(
      { name: "voyager-health-check", version: "1.0.0" },
      { capabilities: {} }
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Connection timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    );

    const connectPromise = async () => {
      await client.connect(transport);
      const toolsResult = await client.listTools();
      return toolsResult.tools || [];
    };

    const tools = await Promise.race([connectPromise(), timeoutPromise]);
    const latency = Date.now() - start;

    await client.close().catch(() => {});

    return {
      label: server.label,
      address: server.address,
      dims: server.dims,
      status: "connected",
      pingMs: latency,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description || "",
      })),
      error: null,
    };
  } catch (err) {
    const latency = Date.now() - start;
    const msg = err.message || "Unknown error";
    let status = "unreachable";

    if (
      msg.includes("401") ||
      msg.includes("unauthorized") ||
      msg.includes("Missing Authorization header") ||
      msg.includes("Invalid token")
    ) {
      status = "auth_required";
    }

    return {
      label: server.label,
      address: server.address,
      dims: server.dims,
      status,
      pingMs: latency,
      tools: [],
      error: msg,
    };
  }
}

/**
 * Handler for GET /api/servers and POST /api/servers/test
 */
export default async function serversHandler(req, res) {
  try {
    const shouldTest = req.method === "POST" || req.query.test === "true";
    const customKey =
      req.headers["x-smithery-key"] ||
      (req.body && req.body.smithery_api_key) ||
      process.env.SMITHERY_API_KEY ||
      "";

    const servers = getAllServers();

    if (!shouldTest) {
      // Just return list with configured status
      return res.status(200).json({
        servers: servers.map((s) => ({
          label: s.label,
          address: s.address,
          dims: s.dims,
          status: "configured",
          pingMs: null,
          tools: [],
          error: null,
        })),
        total: servers.length,
        hasSmitheryKey: Boolean(customKey),
        checkedAt: new Date().toISOString(),
      });
    }

    // Run connection test for all servers in parallel
    const targetServerAddress = req.body?.address || req.query.address;
    const serversToTest = targetServerAddress
      ? servers.filter((s) => s.address === targetServerAddress)
      : servers;

    const testResults = await Promise.all(
      serversToTest.map((s) => testSingleServer(s, customKey))
    );

    const connectedCount = testResults.filter(
      (r) => r.status === "connected"
    ).length;
    const authRequiredCount = testResults.filter(
      (r) => r.status === "auth_required"
    ).length;
    const unreachableCount = testResults.filter(
      (r) => r.status === "unreachable"
    ).length;

    return res.status(200).json({
      servers: testResults,
      total: testResults.length,
      connectedCount,
      authRequiredCount,
      unreachableCount,
      hasSmitheryKey: Boolean(customKey),
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to inspect MCP servers",
      message: error.message,
    });
  }
}
