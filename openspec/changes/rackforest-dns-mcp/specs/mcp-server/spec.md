## ADDED Requirements

### Requirement: Stdio transport
The system SHALL run as an MCP server using stdio transport for communication.

#### Scenario: Server startup
- **WHEN** the process starts
- **THEN** it connects to stdin/stdout as an MCP stdio transport and logs startup to stderr

### Requirement: Tool definitions
The system SHALL expose 5 tools via the MCP `tools/list` handler.

#### Scenario: List tools
- **WHEN** a client sends `tools/list`
- **THEN** the server returns tools: `list_domains`, `list_dns_records`, `add_dns_record`, `edit_dns_record`, `delete_dns_record` with proper input schemas

### Requirement: Tool input schemas
Each tool SHALL define a JSON Schema for its inputs with required fields.

#### Scenario: list_dns_records schema
- **WHEN** inspecting the `list_dns_records` tool
- **THEN** it requires `domain_id` (string)

#### Scenario: add_dns_record schema
- **WHEN** inspecting the `add_dns_record` tool
- **THEN** it requires `domain_id` (string), `type` (enum), `name` (string), `content` (string) and optionally accepts `ttl` (number)

### Requirement: Error handling
The system SHALL return errors as MCP tool responses with `isError: true`.

#### Scenario: Tool execution fails
- **WHEN** a tool call throws an error
- **THEN** the server returns a text content with the error message and `isError: true`

### Requirement: Environment configuration
The system SHALL read credentials from environment variables, with fallback to `.env.local` and `.env` files.

#### Scenario: Environment variables set
- **WHEN** `RACKFOREST_EMAIL` and `RACKFOREST_PASSWORD` are set as environment variables
- **THEN** the server uses those credentials

#### Scenario: Missing credentials
- **WHEN** `RACKFOREST_EMAIL` or `RACKFOREST_PASSWORD` is not set
- **THEN** the server exits with an error message
