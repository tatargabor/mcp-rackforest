#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { RackforestClient } from "./rackforest-client.js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local or .env
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, "../.env"),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      break;
    }
  }
}

loadEnv();

const email = process.env.RACKFOREST_EMAIL;
const password = process.env.RACKFOREST_PASSWORD;
const serviceId = process.env.RACKFOREST_SERVICE_ID;

if (!serviceId) {
  console.error("RACKFOREST_SERVICE_ID must be set");
  process.exit(1);
}

if (!email || !password) {
  console.error("RACKFOREST_EMAIL and RACKFOREST_PASSWORD must be set");
  process.exit(1);
}

const client = new RackforestClient(email, password, serviceId);

const server = new Server(
  { name: "rackforest-dns", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_domains",
      description: "List all domains in your Rackforest account",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "list_dns_records",
      description: "List all DNS records for a domain",
      inputSchema: {
        type: "object" as const,
        properties: {
          domain_id: { type: "string", description: "Domain ID (from list_domains)" },
        },
        required: ["domain_id"],
      },
    },
    {
      name: "add_dns_record",
      description: "Add a new DNS record to a domain",
      inputSchema: {
        type: "object" as const,
        properties: {
          domain_id: { type: "string", description: "Domain ID" },
          type: {
            type: "string",
            description: "Record type",
            enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", "ALIAS"],
          },
          name: { type: "string", description: "Record name (e.g. subdomain.example.com)" },
          content: { type: "string", description: "Record value/content" },
          ttl: {
            type: "number",
            description: "TTL in seconds (600=10min, 3600=1h, 43200=12h, 86400=24h, 172800=48h)",
            default: 600,
          },
        },
        required: ["domain_id", "type", "name", "content"],
      },
    },
    {
      name: "edit_dns_record",
      description: "Edit an existing DNS record",
      inputSchema: {
        type: "object" as const,
        properties: {
          domain_id: { type: "string", description: "Domain ID" },
          record_id: { type: "string", description: "Record ID (from list_dns_records)" },
          name: { type: "string", description: "New record name" },
          content: { type: "string", description: "New record value/content" },
          ttl: { type: "number", description: "TTL in seconds", default: 600 },
        },
        required: ["domain_id", "record_id", "name", "content"],
      },
    },
    {
      name: "delete_dns_record",
      description: "Delete a DNS record",
      inputSchema: {
        type: "object" as const,
        properties: {
          domain_id: { type: "string", description: "Domain ID" },
          record_id: { type: "string", description: "Record ID (from list_dns_records)" },
        },
        required: ["domain_id", "record_id"],
      },
    },
    {
      name: "export_dns_records",
      description: "Export DNS records to Markdown format for backup/documentation. Exports one domain or all domains.",
      inputSchema: {
        type: "object" as const,
        properties: {
          domain_id: { type: "string", description: "Domain ID to export (omit for all domains)" },
          output_path: { type: "string", description: "File path to write the Markdown export (omit to return as text)" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_domains": {
        const domains = await client.listDomains();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(domains, null, 2),
            },
          ],
        };
      }

      case "list_dns_records": {
        const { domain_id } = args as { domain_id: string };
        const result = await client.listDnsRecords(domain_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "add_dns_record": {
        const { domain_id, type, name: recName, content, ttl } = args as {
          domain_id: string;
          type: string;
          name: string;
          content: string;
          ttl?: number;
        };
        const result = await client.addRecord(domain_id, type, recName, content, ttl || 600);
        return { content: [{ type: "text", text: result }] };
      }

      case "edit_dns_record": {
        const { domain_id, record_id, name: recName, content, ttl } = args as {
          domain_id: string;
          record_id: string;
          name: string;
          content: string;
          ttl?: number;
        };
        const result = await client.editRecord(domain_id, record_id, recName, content, ttl || 600);
        return { content: [{ type: "text", text: result }] };
      }

      case "delete_dns_record": {
        const { domain_id, record_id } = args as { domain_id: string; record_id: string };
        const result = await client.deleteRecord(domain_id, record_id);
        return { content: [{ type: "text", text: result }] };
      }

      case "export_dns_records": {
        const { domain_id, output_path } = args as { domain_id?: string; output_path?: string };
        const markdown = await client.exportDnsRecords(domain_id);
        if (output_path) {
          fs.writeFileSync(output_path, markdown, "utf-8");
          return { content: [{ type: "text", text: `DNS export written to ${output_path}` }] };
        }
        return { content: [{ type: "text", text: markdown }] };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Rackforest DNS MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
