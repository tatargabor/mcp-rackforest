## Why

DNS records are critical infrastructure configuration. There's no backup mechanism — if records are accidentally deleted or modified, recovery requires manual reconstruction. An export function provides a safety net and documentation of the current DNS state.

## What Changes

- New `export_dns_records` MCP tool that exports all DNS records for a domain (or all domains) to a structured Markdown file
- Export includes domain name, record type sections, and formatted record tables
- Output suitable for version control, documentation, or disaster recovery

## Capabilities

### New Capabilities
- `dns-export`: Export DNS records to Markdown format for backup and documentation purposes

### Modified Capabilities

## Impact

- **Code**: New method in `RackforestClient`, new tool in MCP server
- **Dependencies**: None (uses existing HTML parsing)
- **Files**: Markdown export written to user-specified path or returned as tool output
