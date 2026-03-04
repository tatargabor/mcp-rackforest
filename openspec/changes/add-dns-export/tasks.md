## 1. Export Function

- [x] 1.1 Add `exportDnsRecords(domainId?: string)` method to RackforestClient that returns formatted Markdown
- [x] 1.2 Implement Markdown formatting: header with domain name, timestamp, record count
- [x] 1.3 Implement record grouping by type with table format (Name | TTL | Priority | Value)
- [x] 1.4 Support all-domains export when no domainId is provided

## 2. MCP Tool

- [x] 2.1 Add `export_dns_records` tool definition with schema (optional domain_id, optional output_path)
- [x] 2.2 Implement tool handler: call export, optionally write to file or return as text
- [x] 2.3 Rebuild and verify tool appears in tools/list

## 3. GitHub Publish Prep

- [x] 3.1 Add README.md with setup instructions, tool descriptions, and usage examples
- [x] 3.2 Add `bin` field and shebang to entry point for npx support
- [x] 3.3 Verify .gitignore covers .env.local, node_modules, dist
- [ ] 3.4 Initial commit and push to GitHub
