## Context

Rackforest is a Hungarian hosting provider using a WHMCS-based portal at `portal.rackforest.com`. There is no public API. DNS management is done through a web UI that uses standard HTML forms with CSRF tokens (`security_token`). The portal uses PHP sessions (`SESSID9efb` cookie).

The project is a greenfield TypeScript MCP server that reverse-engineers the portal's HTTP endpoints to provide programmatic DNS management.

## Goals / Non-Goals

**Goals:**
- Authenticate against Rackforest portal via HTTP form POST
- Provide full DNS record CRUD (list, create, edit, delete)
- Expose operations as MCP tools over stdio transport
- Handle session expiry with automatic re-login
- Support all common DNS record types (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, ALIAS)

**Non-Goals:**
- Browser automation (Playwright/Puppeteer) — pure HTTP requests only
- Domain registration/transfer management
- Billing or service management
- Support for multiple simultaneous accounts
- Rate limiting or request throttling

## Decisions

**1. Pure HTTP client vs browser automation**
- Chose native Node.js `https` module over Playwright/Puppeteer
- Rationale: No browser dependency, lighter weight, works on any Node.js environment, suitable for MCP stdio transport
- Alternative: Playwright would handle JS-rendered content, but the portal uses server-rendered HTML forms

**2. HTML parsing via regex vs DOM parser**
- Chose regex-based parsing over cheerio/jsdom
- Rationale: The HTML structure is predictable (WHMCS templates), avoids additional dependencies. Table rows follow consistent patterns with record IDs in edit links.
- Trade-off: More fragile if WHMCS template changes significantly

**3. Environment-based configuration**
- Credentials via `.env.local` / `.env` files and environment variables
- Rationale: Standard practice for MCP servers, keeps secrets out of config files that might be committed

**4. Session management approach**
- Lazy login on first request, automatic re-login on session expiry detection
- Detection: Check if response contains login form text instead of authenticated content
- CSRF tokens refreshed from each page response

## Risks / Trade-offs

- **[Portal changes]** → WHMCS template updates could break HTML parsing. Mitigation: Fallback parsing strategies, clear error messages when parsing fails.
- **[No official API]** → Rackforest could block automated access. Mitigation: Use realistic User-Agent, don't make excessive requests.
- **[Session cookies]** → PHP sessions expire. Mitigation: Auto re-login on 302 redirect to login page or when login form detected in response.
- **[CSRF tokens]** → Token must be fresh for each mutating request. Mitigation: Extract from every page response and store in session state.

## Endpoint Map

| Operation | Method | URL Pattern |
|-----------|--------|-------------|
| Login | POST | `clientarea/` (action=login) |
| List domains | GET | `clientarea/domains/` |
| List DNS records | GET | `clientarea/services/&service={svcId}&act=dns_manage&domain_id={domId}` |
| Add record | POST | `clientarea/services/accessory-services/{svcId}/&act=add_record&dom={domId}&type={type}` |
| Edit record | POST | `clientarea/services/accessory-services/{svcId}/&act=edit_record&domain_id={domId}&record={recId}` |
| Delete record | GET | `clientarea/services/accessory-services/{svcId}/&act=dns_manage&domain_id={domId}&delete={recId}&security_token={token}` |

Form fields for add/edit: `type`, `dom`, `name`, `ttl`, `content[0]`, `security_token`
