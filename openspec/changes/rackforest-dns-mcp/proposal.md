## Why

Rackforest is a Hungarian hosting provider with no public API for DNS management. Currently, DNS records can only be managed through their WHMCS-based web portal manually. This MCP server automates DNS record management by reverse-engineering the portal's HTTP endpoints, enabling AI agents and tools to programmatically manage DNS records across all domains in a Rackforest account.

## What Changes

- New TypeScript MCP server that authenticates against the Rackforest portal via HTTP form login
- Exposes 5 MCP tools: `list_domains`, `list_dns_records`, `add_dns_record`, `edit_dns_record`, `delete_dns_record`
- Supports all major DNS record types: A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, ALIAS
- Session management with automatic re-login on session expiry
- Configuration via environment variables (email, password, service ID)

## Capabilities

### New Capabilities
- `portal-auth`: HTTP-based authentication against Rackforest WHMCS portal with CSRF token handling and session management
- `dns-management`: Full CRUD operations for DNS records — list, create, edit, delete across all record types
- `mcp-server`: MCP stdio transport server exposing DNS management as tools with proper input schemas

### Modified Capabilities

## Impact

- **Dependencies**: `@modelcontextprotocol/sdk`, `typescript`, `@types/node`
- **APIs**: Rackforest portal HTTP endpoints (reverse-engineered, not officially supported)
- **Configuration**: Requires `RACKFOREST_EMAIL`, `RACKFOREST_PASSWORD`, `RACKFOREST_SERVICE_ID` env vars
- **Security**: Credentials stored in `.env.local` (gitignored), transmitted over HTTPS only
