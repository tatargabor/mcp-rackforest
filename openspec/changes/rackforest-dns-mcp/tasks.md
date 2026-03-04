## 1. Project Setup

- [x] 1.1 Initialize TypeScript project with package.json, tsconfig.json
- [x] 1.2 Install dependencies (@modelcontextprotocol/sdk, typescript, @types/node)
- [x] 1.3 Create .gitignore with node_modules, dist, .env.local
- [x] 1.4 Create .env.example and .env.local with credentials
- [x] 1.5 Create .mcp.json for Claude Code integration

## 2. Portal Authentication

- [x] 2.1 Implement HTTP request helper with cookie management and redirect following
- [x] 2.2 Implement CSRF token extraction from HTML responses
- [x] 2.3 Implement login flow (GET login page → extract token → POST credentials)
- [x] 2.4 Implement automatic session renewal on expiry detection
- [x] 2.5 Implement lazy authentication (defer login until first tool call)

## 3. DNS Management Client

- [x] 3.1 Implement listDomains — parse domain list from /clientarea/domains/
- [x] 3.2 Implement listDnsRecords — parse DNS record tables from management page
- [x] 3.3 Implement addRecord — POST form data to add record endpoint
- [x] 3.4 Implement editRecord — GET edit page for current type, POST updated data
- [x] 3.5 Implement deleteRecord — GET delete URL with security token

## 4. MCP Server

- [x] 4.1 Implement MCP server with stdio transport
- [x] 4.2 Define tool schemas (list_domains, list_dns_records, add_dns_record, edit_dns_record, delete_dns_record)
- [x] 4.3 Implement CallTool handler routing to client methods
- [x] 4.4 Implement error handling (catch errors, return isError responses)
- [x] 4.5 Implement .env file loading with fallback paths

## 5. Verification

- [x] 5.1 Build project (tsc compiles without errors)
- [x] 5.2 Verify tools/list returns all 5 tools
- [x] 5.3 Verify list_domains returns correct domain data
- [x] 5.4 Verify list_dns_records returns parsed records with correct fields
