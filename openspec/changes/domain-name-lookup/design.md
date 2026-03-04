## Context

Tools accept `domain_id` as a string parameter. The change adds name-based resolution without breaking existing ID-based usage.

## Goals / Non-Goals

**Goals:**
- Accept domain name or ID in all DNS tools
- Cache domain list within session to avoid repeated lookups
- Keep backward compatibility with numeric IDs

**Non-Goals:**
- Fuzzy matching or partial name search
- Domain name validation beyond contains-dot check

## Decisions

**1. Detection: dot-based**
- If the value contains `.` → treat as domain name → resolve via `listDomains()`
- Otherwise → treat as ID
- Rationale: Simple, reliable, domain names always have dots, IDs never do

**2. Session-level cache**
- Cache the domain list after first `listDomains()` call
- Invalidate on next login
- Rationale: Domain list rarely changes mid-session, avoids repeated HTTP calls

**3. Single resolver method**
- `resolveDomainId(domainIdOrName: string): Promise<string>` returns the numeric ID
- All tools call this instead of using the raw parameter
- Rationale: DRY, single point of change
