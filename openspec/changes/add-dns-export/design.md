## Context

The MCP server already has `listDnsRecords` which returns parsed records as JSON. The export feature builds on this to produce human-readable Markdown output.

## Goals / Non-Goals

**Goals:**
- Export all DNS records for one or all domains to Markdown
- Produce output suitable for git-tracked backups
- Make the export available as an MCP tool

**Non-Goals:**
- Import/restore from Markdown (future work)
- JSON/YAML/BIND zone file export formats
- Automated scheduled backups

## Decisions

**1. Output as tool response vs file write**
- Return Markdown as MCP tool text content by default
- Optionally write to a file path if provided
- Rationale: MCP tools should return data; the caller decides what to do with it. File write is a convenience option.

**2. Markdown format**
- Group records by type (A, CNAME, MX, TXT, etc.) using tables
- Include metadata header (domain name, export timestamp, record count)
- Rationale: Tables are readable and diffable in git

**3. Single domain vs all domains**
- If `domain_id` is provided, export that domain
- If omitted, export all domains in sequence
- Rationale: Both use cases are common — single domain check vs full account backup
