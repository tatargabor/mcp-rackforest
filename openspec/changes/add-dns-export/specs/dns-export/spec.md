## ADDED Requirements

### Requirement: Export DNS records to Markdown
The system SHALL export DNS records for a domain as a formatted Markdown document.

#### Scenario: Export single domain
- **WHEN** the user calls `export_dns_records` with a `domain_id`
- **THEN** the system returns a Markdown document containing all DNS records for that domain, grouped by record type

#### Scenario: Export all domains
- **WHEN** the user calls `export_dns_records` without a `domain_id`
- **THEN** the system exports records for all domains in the account, each as a separate section

### Requirement: Markdown format structure
The export SHALL use a consistent Markdown structure with metadata and record tables.

#### Scenario: Document header
- **WHEN** a domain is exported
- **THEN** the output includes domain name as heading, export timestamp, and total record count

#### Scenario: Records grouped by type
- **WHEN** records exist for multiple types (A, CNAME, MX, TXT, etc.)
- **THEN** each type gets its own subsection with a table containing Name, TTL, Priority, and Value columns

#### Scenario: Empty record type
- **WHEN** a domain has no records of a particular type
- **THEN** that type section is omitted from the output

### Requirement: Optional file output
The system SHALL optionally write the export to a file path.

#### Scenario: File path provided
- **WHEN** the user provides an `output_path` parameter
- **THEN** the system writes the Markdown to that file and returns a confirmation message

#### Scenario: No file path
- **WHEN** no `output_path` is provided
- **THEN** the system returns the Markdown content directly as the tool response
