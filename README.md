# mcp-rackforest

MCP server for managing DNS records on [Rackforest](https://rackforest.com) hosting provider.

Rackforest has no public API — this server reverse-engineers the WHMCS portal's HTTP endpoints to provide programmatic DNS management via the [Model Context Protocol](https://modelcontextprotocol.io).

## Tools

| Tool | Description |
|------|-------------|
| `list_domains` | List all domains in your account |
| `list_dns_records` | List all DNS records for a domain |
| `add_dns_record` | Add a new DNS record (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, ALIAS) |
| `edit_dns_record` | Edit an existing DNS record |
| `delete_dns_record` | Delete a DNS record |
| `export_dns_records` | Export DNS records to Markdown (single domain or all) |

## Setup

### 1. Clone and build

```bash
git clone https://github.com/tatargabor/mcp-rackforest.git
cd mcp-rackforest
npm install
npm run build
```

### 2. Configure credentials

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Rackforest portal credentials:

```
RACKFOREST_EMAIL=your@email.com
RACKFOREST_PASSWORD=your_password
RACKFOREST_SERVICE_ID=50693
```

> The `RACKFOREST_SERVICE_ID` is the service number from your Rackforest DNS management URL.

### 3. Add to Claude Code

Add to your `.mcp.json` or Claude Code settings:

```json
{
  "mcpServers": {
    "rackforest-dns": {
      "command": "node",
      "args": ["/path/to/mcp-rackforest/dist/index.js"]
    }
  }
}
```

## Usage Examples

Once configured, you can ask Claude:

- "List my domains on Rackforest"
- "Show DNS records for itline.hu"
- "Add a CNAME record pointing app.example.com to myapp.railway.app"
- "Export all DNS records as backup"
- "Delete the old TXT record with ID 325385"

## How It Works

The server authenticates against `portal.rackforest.com` using your email/password, then makes HTTP requests to the same endpoints the web portal uses. It parses HTML responses to extract DNS record data.

- Session cookies are managed automatically
- CSRF tokens are refreshed on every request
- Expired sessions trigger automatic re-login

## License

ISC
