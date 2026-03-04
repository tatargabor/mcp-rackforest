import * as https from "https";
import * as http from "http";

export interface DnsRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  priority: number;
}

export interface DomainInfo {
  id: string;
  name: string;
}

interface SessionState {
  cookies: Record<string, string>;
  securityToken: string;
}

export class RackforestClient {
  private baseUrl = "https://portal.rackforest.com";
  private session: SessionState | null = null;
  private domainCache: DomainInfo[] | null = null;
  private email: string;
  private password: string;
  private serviceId: string;

  constructor(email: string, password: string, serviceId: string) {
    this.email = email;
    this.password = password;
    this.serviceId = serviceId;
  }

  private async httpRequest(
    url: string,
    options: {
      method?: string;
      body?: string;
      headers?: Record<string, string>;
      followRedirects?: boolean;
    } = {}
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string; cookies: Record<string, string> }> {
    const method = options.method || "GET";
    const parsedUrl = new URL(url);

    const reqHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "hu",
      ...options.headers,
    };

    if (this.session) {
      reqHeaders["Cookie"] = Object.entries(this.session.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
    }

    if (options.body) {
      reqHeaders["Content-Type"] = "application/x-www-form-urlencoded";
      reqHeaders["Content-Length"] = Buffer.byteLength(options.body).toString();
    }

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 443,
          path: parsedUrl.pathname + parsedUrl.search,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            const cookies: Record<string, string> = {};
            const setCookies = res.headers["set-cookie"];
            if (setCookies) {
              for (const sc of setCookies) {
                const match = sc.match(/^([^=]+)=([^;]*)/);
                if (match) cookies[match[1]] = match[2];
              }
            }

            // Follow redirects
            if (
              options.followRedirects !== false &&
              res.statusCode &&
              [301, 302, 303, 307].includes(res.statusCode) &&
              res.headers.location
            ) {
              const redirectUrl = res.headers.location.startsWith("http")
                ? res.headers.location
                : `${this.baseUrl}/${res.headers.location.replace(/^\//, "")}`;

              // Merge cookies before redirect
              if (this.session) {
                Object.assign(this.session.cookies, cookies);
              }

              this.httpRequest(redirectUrl, { ...options, method: "GET", body: undefined })
                .then(resolve)
                .catch(reject);
              return;
            }

            resolve({ statusCode: res.statusCode || 0, headers: res.headers, body, cookies });
          });
        }
      );
      req.on("error", reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  private extractSecurityToken(html: string): string {
    const match = html.match(/name="security_token"\s+value="([^"]+)"/);
    if (!match) {
      const metaMatch = html.match(/csrf-token"\s+content="([^"]+)"/);
      if (!metaMatch) throw new Error("Cannot find security token");
      return metaMatch[1];
    }
    return match[1];
  }

  async login(): Promise<void> {
    // Step 1: Get login page for CSRF token and session cookie
    const loginPage = await this.httpRequest(`${this.baseUrl}/clientarea/`);
    const sessionCookies: Record<string, string> = { ...loginPage.cookies };
    const csrfToken = this.extractSecurityToken(loginPage.body);

    this.session = { cookies: sessionCookies, securityToken: csrfToken };

    // Step 2: POST login
    const body = new URLSearchParams({
      action: "login",
      username: this.email,
      password: this.password,
      security_token: csrfToken,
    }).toString();

    const loginResp = await this.httpRequest(`${this.baseUrl}/clientarea/`, {
      method: "POST",
      body,
      headers: {
        Referer: `${this.baseUrl}/clientarea/`,
        Origin: this.baseUrl,
      },
    });

    // Merge cookies
    Object.assign(this.session.cookies, loginResp.cookies);

    // Verify login succeeded
    if (loginResp.body.includes("setUserId")) {
      // Update security token from response
      try {
        this.session.securityToken = this.extractSecurityToken(loginResp.body);
      } catch {}
    } else {
      throw new Error("Login failed - check credentials");
    }
  }

  private async ensureLoggedIn(): Promise<void> {
    if (!this.session) {
      await this.login();
    }
  }

  private async fetchPage(path: string): Promise<string> {
    await this.ensureLoggedIn();
    const resp = await this.httpRequest(`${this.baseUrl}/${path}`);

    // If redirected to login, re-login
    if (resp.body.includes("Bejelentkezés regisztrált") && !resp.body.includes("setUserId")) {
      this.session = null;
      this.domainCache = null;
      await this.login();
      const retry = await this.httpRequest(`${this.baseUrl}/${path}`);
      return retry.body;
    }

    // Update security token
    try {
      this.session!.securityToken = this.extractSecurityToken(resp.body);
    } catch {}

    return resp.body;
  }

  async listDomains(): Promise<DomainInfo[]> {
    if (this.domainCache) return this.domainCache;

    // Fetch from DNS service page — these IDs match dns_manage domain_id
    const html = await this.fetchPage(
      `clientarea/services/accessory-services/${this.serviceId}/`
    );
    const domains: DomainInfo[] = [];
    const regex = /dns_manage&domain_id=(\d+)"[^>]*>([^<]+)</g;
    let match;
    while ((match = regex.exec(html))) {
      const id = match[1];
      const name = match[2].trim();
      if (!domains.find((d) => d.id === id)) {
        domains.push({ id, name });
      }
    }
    this.domainCache = domains;
    return domains;
  }

  async resolveDomainId(domainIdOrName: string): Promise<string> {
    // If it contains a dot, treat as domain name
    if (domainIdOrName.includes(".")) {
      const domains = await this.listDomains();
      const found = domains.find((d) => d.name === domainIdOrName);
      if (!found) {
        const available = domains.map((d) => d.name).join(", ");
        throw new Error(`Domain "${domainIdOrName}" not found. Available: ${available}`);
      }
      return found.id;
    }
    return domainIdOrName;
  }

  async listDnsRecords(domainId: string): Promise<{ domain: string; records: DnsRecord[] }> {
    domainId = await this.resolveDomainId(domainId);
    const html = await this.fetchPage(
      `clientarea/services/accessory-services/${this.serviceId}/&act=dns_manage&domain_id=${domainId}`
    );

    // Extract domain name
    const domainMatch = html.match(/Domain:\s*([^\s<]+)/);
    const domain = domainMatch ? domainMatch[1] : "unknown";

    const records: DnsRecord[] = [];

    // Parse record tables - each record has: edit link (with record id), name, priority, ttl, type, content
    // Pattern: edit_record&domain_id=X&record=ID ... then table cells
    const recordRegex =
      /act=edit_record&domain_id=\d+&record=(\d+)"[\s\S]*?<\/tr>/g;

    // Alternative: parse from structured table rows
    // Each record section: SOA, NS, TXT, MX, CNAME, A records
    const sectionRegex =
      /(?:<h\d[^>]*>|<strong>)\s*(\w+)\s*Rekord(?:ok)?\s*(?:<\/h\d>|<\/strong>)([\s\S]*?)(?=(?:<h\d|<strong)\s*\w+\s*Rekord|Új rekord hozzáadása|$)/gi;

    let sectionMatch;
    while ((sectionMatch = sectionRegex.exec(html))) {
      const recordType = sectionMatch[1];
      const sectionHtml = sectionMatch[2];

      // Find each record row with edit link
      const rowRegex =
        /record=(\d+)"[\s\S]*?<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g;

      let rowMatch;
      while ((rowMatch = rowRegex.exec(sectionHtml))) {
        records.push({
          id: rowMatch[1],
          name: rowMatch[2].trim(),
          priority: parseInt(rowMatch[3].trim()) || 0,
          ttl: parseInt(rowMatch[4].trim()) || 600,
          type: rowMatch[5].trim() || recordType,
          content: rowMatch[6].replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim(),
        });
      }
    }

    // Fallback: simpler parsing if regex didn't match table structure
    if (records.length === 0) {
      const simpleRegex = /record=(\d+)/g;
      const recordIds: string[] = [];
      let m;
      while ((m = simpleRegex.exec(html))) {
        if (!recordIds.includes(m[1])) recordIds.push(m[1]);
      }

      // Parse the text content between records
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");

      // Find all table rows with record data
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
      let trMatch;
      while ((trMatch = trRegex.exec(textContent))) {
        const row = trMatch[1];
        const editMatch = row.match(/record=(\d+)/);
        if (!editMatch) continue;

        const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
          c[1].replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&laquo;/g, "").trim()
        );

        if (cells.length >= 5) {
          records.push({
            id: editMatch[1],
            name: cells[0],
            priority: parseInt(cells[1]) || 0,
            ttl: parseInt(cells[2]) || 600,
            type: cells[3],
            content: cells[4],
          });
        }
      }
    }

    return { domain, records };
  }

  async addRecord(
    domainId: string,
    type: string,
    name: string,
    content: string,
    ttl: number = 600
  ): Promise<string> {
    domainId = await this.resolveDomainId(domainId);
    await this.ensureLoggedIn();

    const body = new URLSearchParams({
      type: type.toUpperCase(),
      dom: domainId,
      name,
      ttl: ttl.toString(),
      "content[0]": content,
      security_token: this.session!.securityToken,
    }).toString();

    const resp = await this.httpRequest(
      `${this.baseUrl}/clientarea/services/accessory-services/${this.serviceId}/&act=add_record&dom=${domainId}&type=${type.toUpperCase()}`,
      {
        method: "POST",
        body,
        headers: {
          Referer: `${this.baseUrl}/clientarea/services/&service=${this.serviceId}&act=dns_manage&domain_id=${domainId}`,
          Origin: this.baseUrl,
        },
      }
    );

    // Update security token
    try {
      this.session!.securityToken = this.extractSecurityToken(resp.body);
    } catch {}

    if (resp.body.includes("error") && !resp.body.includes("noError")) {
      const errorMatch = resp.body.match(/class="[^"]*error[^"]*"[^>]*>([\s\S]*?)<\//);
      throw new Error(`Add record failed: ${errorMatch ? errorMatch[1].trim() : "unknown error"}`);
    }

    return `Record ${type} ${name} -> ${content} added successfully`;
  }

  async editRecord(
    domainId: string,
    recordId: string,
    name: string,
    content: string,
    ttl: number = 600,
    type?: string
  ): Promise<string> {
    domainId = await this.resolveDomainId(domainId);
    await this.ensureLoggedIn();

    // First get the edit page to find current values and form structure
    const editPage = await this.fetchPage(
      `clientarea/services/accessory-services/${this.serviceId}/&act=edit_record&domain_id=${domainId}&record=${recordId}`
    );

    // Extract current type from the page if not provided
    if (!type) {
      const typeMatch = editPage.match(/name="type"\s+value="([^"]+)"/);
      type = typeMatch ? typeMatch[1] : "A";
    }

    const body = new URLSearchParams({
      type,
      dom: domainId,
      name,
      ttl: ttl.toString(),
      "content[0]": content,
      security_token: this.session!.securityToken,
    }).toString();

    const resp = await this.httpRequest(
      `${this.baseUrl}/clientarea/services/accessory-services/${this.serviceId}/&act=edit_record&domain_id=${domainId}&record=${recordId}`,
      {
        method: "POST",
        body,
        headers: {
          Referer: `${this.baseUrl}/clientarea/services/accessory-services/${this.serviceId}/&act=edit_record&domain_id=${domainId}&record=${recordId}`,
          Origin: this.baseUrl,
        },
      }
    );

    try {
      this.session!.securityToken = this.extractSecurityToken(resp.body);
    } catch {}

    return `Record ${recordId} updated: ${name} -> ${content}`;
  }

  async deleteRecord(domainId: string, recordId: string): Promise<string> {
    domainId = await this.resolveDomainId(domainId);
    await this.ensureLoggedIn();

    const resp = await this.fetchPage(
      `clientarea/services/accessory-services/${this.serviceId}/&act=dns_manage&domain_id=${domainId}&delete=${recordId}&security_token=${this.session!.securityToken}`
    );

    return `Record ${recordId} deleted`;
  }

  async getDomainDnsPage(domainId: string): Promise<string> {
    return this.fetchPage(
      `clientarea/services/&service=${this.serviceId}&act=dns_manage&domain_id=${domainId}`
    );
  }

  async exportDnsRecords(domainId?: string): Promise<string> {
    let domains: DomainInfo[];

    if (domainId) {
      const resolvedId = await this.resolveDomainId(domainId);
      const allDomains = await this.listDomains();
      const found = allDomains.find((d) => d.id === resolvedId);
      domains = [found || { id: resolvedId, name: domainId }];
    } else {
      domains = await this.listDomains();
    }

    const timestamp = new Date().toISOString().replace(/T/, " ").replace(/\..+/, " UTC");
    const sections: string[] = [];

    for (const domain of domains) {
      const { records } = await this.listDnsRecords(domain.id);

      // Group records by type
      const byType: Record<string, DnsRecord[]> = {};
      for (const rec of records) {
        const t = rec.type || "OTHER";
        if (!byType[t]) byType[t] = [];
        byType[t].push(rec);
      }

      const typeOrder = ["SOA", "NS", "A", "AAAA", "CNAME", "MX", "TXT", "SRV", "CAA", "ALIAS"];
      const sortedTypes = Object.keys(byType).sort(
        (a, b) => (typeOrder.indexOf(a) === -1 ? 999 : typeOrder.indexOf(a)) - (typeOrder.indexOf(b) === -1 ? 999 : typeOrder.indexOf(b))
      );

      let md = `# ${domain.name}\n\n`;
      md += `- **Exported:** ${timestamp}\n`;
      md += `- **Domain ID:** ${domain.id}\n`;
      md += `- **Total records:** ${records.length}\n\n`;

      for (const type of sortedTypes) {
        const recs = byType[type];
        md += `## ${type} Records\n\n`;
        md += `| Name | TTL | Priority | Value |\n`;
        md += `|------|-----|----------|-------|\n`;
        for (const r of recs) {
          const val = r.content.replace(/\|/g, "\\|").replace(/\n/g, " ");
          md += `| ${r.name} | ${r.ttl} | ${r.priority} | ${val} |\n`;
        }
        md += "\n";
      }

      sections.push(md);
    }

    let output = `# DNS Export\n\n`;
    output += `- **Date:** ${timestamp}\n`;
    output += `- **Domains:** ${domains.length}\n\n---\n\n`;
    output += sections.join("---\n\n");

    return output;
  }
}
