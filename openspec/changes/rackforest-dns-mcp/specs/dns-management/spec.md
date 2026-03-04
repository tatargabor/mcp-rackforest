## ADDED Requirements

### Requirement: List domains
The system SHALL retrieve all domains associated with the Rackforest account.

#### Scenario: Domains exist
- **WHEN** the user calls `list_domains`
- **THEN** the system returns an array of objects with `id` and `name` fields for each domain

### Requirement: List DNS records
The system SHALL retrieve all DNS records for a given domain ID.

#### Scenario: Domain has records
- **WHEN** the user calls `list_dns_records` with a valid `domain_id`
- **THEN** the system returns the domain name and an array of records, each with `id`, `name`, `type`, `content`, `ttl`, and `priority` fields

#### Scenario: Record types parsed
- **WHEN** DNS records are retrieved
- **THEN** records of all types (SOA, NS, A, AAAA, CNAME, MX, TXT, SRV, CAA) SHALL be parsed from the HTML table structure

### Requirement: Add DNS record
The system SHALL create a new DNS record by POSTing form data to the add record endpoint.

#### Scenario: Add A record
- **WHEN** the user calls `add_dns_record` with `domain_id`, `type=A`, `name`, and `content` (IP address)
- **THEN** the system POSTs the record data and returns a success message

#### Scenario: Add record with custom TTL
- **WHEN** the user specifies a `ttl` value (600, 3600, 43200, 86400, or 172800)
- **THEN** the record is created with the specified TTL

#### Scenario: Default TTL
- **WHEN** no `ttl` is specified
- **THEN** the record is created with TTL 600 (10 minutes)

### Requirement: Edit DNS record
The system SHALL modify an existing DNS record by POSTing updated form data to the edit record endpoint.

#### Scenario: Edit record content
- **WHEN** the user calls `edit_dns_record` with `domain_id`, `record_id`, `name`, and `content`
- **THEN** the system updates the record and returns a success message

#### Scenario: Preserve record type on edit
- **WHEN** no `type` is specified in the edit call
- **THEN** the system reads the current type from the edit page and preserves it

### Requirement: Delete DNS record
The system SHALL delete a DNS record by issuing a GET request with the record ID and security token.

#### Scenario: Delete existing record
- **WHEN** the user calls `delete_dns_record` with `domain_id` and `record_id`
- **THEN** the system sends the delete request with a valid security token and returns a success message

### Requirement: Supported record types
The system SHALL support the following DNS record types: A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, ALIAS.

#### Scenario: Record type in add operation
- **WHEN** the user specifies any supported record type
- **THEN** the system passes the type to the Rackforest portal correctly
