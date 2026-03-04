## ADDED Requirements

### Requirement: Login via HTTP form POST
The system SHALL authenticate against the Rackforest portal by POSTing credentials to the login endpoint with a valid CSRF token.

#### Scenario: Successful login
- **WHEN** valid email and password are provided
- **THEN** the system obtains a session cookie and CSRF token for subsequent requests

#### Scenario: Invalid credentials
- **WHEN** invalid email or password is provided
- **THEN** the system throws an error with message "Login failed - check credentials"

### Requirement: CSRF token extraction
The system SHALL extract the `security_token` value from HTML responses and include it in all mutating requests.

#### Scenario: Token found in HTML
- **WHEN** an HTML response contains `name="security_token" value="<token>"`
- **THEN** the system stores and uses the extracted token for subsequent requests

#### Scenario: Token not found
- **WHEN** an HTML response does not contain a security token
- **THEN** the system throws an error indicating the token cannot be found

### Requirement: Automatic session renewal
The system SHALL detect expired sessions and automatically re-authenticate.

#### Scenario: Session expired during request
- **WHEN** a page response contains the login form instead of authenticated content
- **THEN** the system re-authenticates and retries the original request

### Requirement: Lazy authentication
The system SHALL defer login until the first API call is made.

#### Scenario: No request made yet
- **WHEN** the MCP server starts
- **THEN** no login request is made until a tool is invoked
