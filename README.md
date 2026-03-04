# mcp-rackforest

MCP server for managing DNS records on [Rackforest](https://rackforest.com) hosting provider.

Rackforest has no public API — this server reverse-engineers the WHMCS portal's HTTP endpoints to provide programmatic DNS management via the [Model Context Protocol](https://modelcontextprotocol.io).

## Tools

| Tool | Description |
|------|-------------|
| `list_domains` | List all domains in your account |
| `list_dns_records` | List all DNS records for a domain (accepts domain name or ID) |
| `add_dns_record` | Add a new DNS record (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, ALIAS) |
| `edit_dns_record` | Edit an existing DNS record |
| `delete_dns_record` | Delete a DNS record |
| `export_dns_records` | Export DNS records to Markdown (single domain or all) |

All tools that accept a `domain_id` parameter work with both **domain names** (e.g. `"example.hu"`) and **numeric IDs** (e.g. `"23660"`). Domain names are automatically resolved to their numeric IDs.

## Setup

### 1. Install

```bash
npx mcp-rackforest
```

Or clone and build manually:

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
RACKFOREST_SERVICE_ID=your_service_id
```

### 3. How to find your Service ID

1. Log in to [portal.rackforest.com](https://portal.rackforest.com)
2. Navigate to **Services** → select your DNS hosting service
3. Look at the URL — it will look like: `https://portal.rackforest.com/clientarea/services/accessory-services/12345/`
4. The number (`12345`) is your **Service ID**

### 4. Add to Claude Code

**Global (available in all projects):**

```bash
claude mcp add --scope user rackforest-dns -- node /path/to/mcp-rackforest/dist/index.js
```

**Project-only (add to `.mcp.json` in your project root):**

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

**With npx (no clone needed):**

```json
{
  "mcpServers": {
    "rackforest-dns": {
      "command": "npx",
      "args": ["-y", "mcp-rackforest"],
      "env": {
        "RACKFOREST_EMAIL": "your@email.com",
        "RACKFOREST_PASSWORD": "your_password",
        "RACKFOREST_SERVICE_ID": "12345"
      }
    }
  }
}
```

## Tool Reference

### list_domains

Lists all domains in your Rackforest account.

```
> List my domains on Rackforest
[
  { "id": "23660", "name": "example.hu" },
  { "id": "23661", "name": "myshop.hu" },
  { "id": "23662", "name": "company.com" }
]
```

### list_dns_records

Lists all DNS records for a domain. Accepts domain name or numeric ID.

```
> Show DNS records for myshop.hu

Domain: myshop.hu
Records:
  A     myshop.hu        → 93.184.216.34    (TTL: 600)
  A     www.myshop.hu    → 93.184.216.34    (TTL: 600)
  CNAME api.myshop.hu    → myapp.railway.app (TTL: 3600)
  MX    myshop.hu        → mail.myshop.hu   (TTL: 3600, priority: 10)
  TXT   myshop.hu        → "v=spf1 ..."     (TTL: 3600)
```

### add_dns_record

Add a new DNS record. Supported types: A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, ALIAS.

```
> Add a CNAME record: app.myshop.hu → myapp.railway.app with 1 hour TTL

Record CNAME app.myshop.hu -> myapp.railway.app added successfully
```

```
> Add a TXT record for SPF on example.hu

Record TXT example.hu -> "v=spf1 include:_spf.google.com ~all" added successfully
```

### edit_dns_record

Edit an existing DNS record. Use `list_dns_records` first to get the record ID.

```
> Change the A record for www.example.hu to point to 203.0.113.50

Record 45123 updated: www.example.hu -> 203.0.113.50
```

### delete_dns_record

Delete a DNS record. Use `list_dns_records` first to get the record ID.

```
> Delete the old TXT verification record from example.hu

Record 45200 deleted
```

### export_dns_records

Export DNS records to Markdown format for backup or documentation.

```
> Export all DNS records as backup

# DNS Export
- Date: 2025-01-15 10:30:00 UTC
- Domains: 3

---

# example.hu
- Total records: 8

## A Records
| Name | TTL | Priority | Value |
|------|-----|----------|-------|
| example.hu | 600 | 0 | 93.184.216.34 |
| www.example.hu | 600 | 0 | 93.184.216.34 |

## MX Records
| Name | TTL | Priority | Value |
|------|-----|----------|-------|
| example.hu | 3600 | 10 | mail.example.hu |
...
```

## Usage Examples

Once configured, you can ask Claude:

- "List my domains on Rackforest"
- "Show DNS records for myshop.hu"
- "Add a CNAME record pointing app.example.com to myapp.railway.app"
- "Add an A record for staging.example.hu pointing to 203.0.113.10"
- "Change the TTL on www.example.hu to 1 hour"
- "Delete the old TXT verification record from example.hu"
- "Export all DNS records as a Markdown backup"
- "Export DNS records for company.com to dns-backup.md"

## How It Works

The server authenticates against `portal.rackforest.com` using your email/password, then makes HTTP requests to the same endpoints the web portal uses. It parses HTML responses to extract DNS record data.

- Session cookies are managed automatically
- CSRF tokens are refreshed on every request
- Expired sessions trigger automatic re-login
- Domain list is cached within a session for performance

## License

ISC
