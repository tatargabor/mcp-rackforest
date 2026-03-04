## Why

All DNS tools currently require a numeric `domain_id` parameter, forcing the AI to always call `list_domains` first to resolve domain names to IDs. This adds an unnecessary round-trip for every DNS operation.

## What Changes

- All tools that accept `domain_id` now also accept a domain name (e.g., `"example.hu"`)
- A shared resolver in the client automatically looks up the ID when a domain name is provided
- Detection logic: contains `.` → domain name → lookup; otherwise → treated as numeric ID
- Tool schema descriptions updated to reflect both options

## Capabilities

### New Capabilities
- `domain-resolver`: Automatic domain name to ID resolution, allowing tools to accept either format

### Modified Capabilities

## Impact

- **Code**: New `resolveDomainId` method in `RackforestClient`, updated all tool descriptions
- **Breaking**: None — numeric IDs still work exactly as before
- **Performance**: One extra HTTP call when using domain name (cached after first lookup within session)
