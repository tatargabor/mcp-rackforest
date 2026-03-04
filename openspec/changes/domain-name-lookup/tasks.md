## 1. Domain Resolver

- [ ] 1.1 Add `domainCache` field to RackforestClient and clear it on re-login
- [ ] 1.2 Add `resolveDomainId(domainIdOrName: string)` method — dot check, cache, lookup, error with available domains
- [ ] 1.3 Update `listDnsRecords`, `addRecord`, `editRecord`, `deleteRecord`, `exportDnsRecords` to call `resolveDomainId`

## 2. Tool Schema Updates

- [x] 2.1 Update all tool descriptions: `domain_id` accepts domain name or numeric ID
- [x] 2.2 Add examples to descriptions (e.g., `"example.hu" or "23660"`)

## 3. Documentation

- [x] 3.1 Update README with comprehensive usage examples using domain names
- [x] 3.2 Add detailed tool documentation section with fictional examples for each tool
- [x] 3.3 Add a "How to find your Service ID" section to README

## 4. Verify

- [x] 4.1 Build and test tools/list shows updated descriptions
- [ ] 4.2 Test list_dns_records with domain name resolves correctly
