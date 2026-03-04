## ADDED Requirements

### Requirement: Resolve domain name to ID
The system SHALL accept either a numeric domain ID or a domain name string in all DNS tools.

#### Scenario: Domain name provided
- **WHEN** a tool receives a value containing a dot (e.g., `"example.hu"`)
- **THEN** the system resolves it to the numeric domain ID via the domain list

#### Scenario: Numeric ID provided
- **WHEN** a tool receives a value without a dot (e.g., `"23660"`)
- **THEN** the system uses it directly as the domain ID

#### Scenario: Unknown domain name
- **WHEN** a domain name is provided that does not exist in the account
- **THEN** the system throws an error with the domain name and lists available domains

### Requirement: Domain list caching
The system SHALL cache the domain list within a session to avoid redundant HTTP calls.

#### Scenario: First lookup
- **WHEN** a domain name is resolved for the first time in a session
- **THEN** the system calls `listDomains()` and caches the result

#### Scenario: Subsequent lookups
- **WHEN** a domain name is resolved again in the same session
- **THEN** the system uses the cached domain list without making another HTTP call

#### Scenario: Cache cleared on re-login
- **WHEN** the session expires and re-authentication occurs
- **THEN** the domain list cache is cleared
