# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in OpenClaw CRM, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please:

1. **Email us at:** security@openclaw-crm.dev
2. **Or open a private security advisory** on GitHub: https://github.com/giorgosn/openclaw-crm/security/advisories/new

### What to include

- **Description of the vulnerability** — What is the security issue?
- **Steps to reproduce** — How can we reproduce the issue?
- **Potential impact** — What could an attacker do with this vulnerability?
- **Suggested fix** — If you have an idea for how to fix it (optional)
- **Your contact info** — So we can follow up with questions

### What to expect

- **Acknowledgment within 48 hours** — We'll confirm we received your report
- **A plan for a fix within 7 days** — We'll assess severity and create a timeline
- **Credit in the release notes** — Unless you prefer to remain anonymous
- **A patch release** — Critical vulnerabilities will be patched immediately

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x (beta) | Yes |

Older versions are not supported. Please upgrade to the latest release.

## Security Considerations for Self-Hosting

OpenClaw CRM is designed for **self-hosted deployment**. As the operator, you are responsible for:

### 1. Keep your deployment updated
- Watch the GitHub repository for security releases
- Subscribe to security advisories: https://github.com/giorgosn/openclaw-crm/security/advisories
- Upgrade to the latest version promptly

### 2. Secure your PostgreSQL database
- Use a strong password for the `postgres` user
- Do not expose PostgreSQL port (5432) to the public internet
- Use `DATABASE_URL` with SSL in production (`?sslmode=require`)
- Enable PostgreSQL authentication (pg_hba.conf)
- Regular database backups

### 3. Use HTTPS in production
- OpenClaw CRM should always run behind HTTPS in production
- Use a reverse proxy like Nginx or Caddy with automatic HTTPS (Let's Encrypt)
- Set `BETTER_AUTH_TRUSTED_ORIGINS` to your HTTPS domain(s)

Example Nginx config:
```nginx
server {
    listen 443 ssl http2;
    server_name crm.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/crm.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.yourcompany.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Set a strong BETTER_AUTH_SECRET
```bash
# Generate a secure random secret
openssl rand -base64 32

# Add to .env
BETTER_AUTH_SECRET=your-generated-secret-here
```

Never use the example secret from `.env.example` in production.

### 5. Protect sensitive files
- **Never commit `.env` files** to version control
- **Never expose API keys** in client-side code or public repos
- **Set proper file permissions** on `.env` files (chmod 600)
- **Use environment variables** for secrets, not hardcoded values

### 6. Restrict network access
- Use firewall rules to limit access to your instance
- Consider VPN or IP whitelisting for admin access
- Use Docker network isolation (don't expose all ports)
- Disable unnecessary services

### 7. Regular backups
```bash
# Backup PostgreSQL database
docker compose exec db pg_dump -U postgres openclaw > backup.sql

# Restore from backup
docker compose exec -T db psql -U postgres openclaw < backup.sql
```

Automate backups with cron or a backup service.

### 8. Monitor logs
- Check Docker logs regularly: `docker compose logs -f`
- Watch for suspicious activity (failed login attempts, unusual API usage)
- Set up log aggregation (optional) for production deployments

## Common Security Issues

### API Key Exposure
- API keys start with `oc_sk_` and grant full access to the workspace
- Store API keys securely (password manager, environment variables)
- Revoke API keys if compromised (Settings → API Keys)
- Use separate API keys per integration (easier to revoke)

### SQL Injection
- OpenClaw uses Drizzle ORM with parameterized queries (safe by default)
- Do not bypass the ORM and write raw SQL unless necessary
- If writing raw SQL, use parameterized queries: `db.execute(sql`SELECT * FROM users WHERE id = ${userId}`)`

### XSS (Cross-Site Scripting)
- React escapes all strings by default (safe by default)
- TipTap rich text editor sanitizes HTML
- Do not use `dangerouslySetInnerHTML` without sanitization

### CSRF (Cross-Site Request Forgery)
- Better Auth includes CSRF protection
- API routes use Bearer token authentication (not cookies)
- No additional CSRF tokens needed for API routes

### Rate Limiting
- OpenClaw does not include built-in rate limiting (planned for future)
- Use a reverse proxy (Nginx, Caddy) with rate limiting:
  ```nginx
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

  location /api/ {
      limit_req zone=api burst=20;
      proxy_pass http://localhost:3001;
  }
  ```

## Dependencies

We regularly review dependencies for known vulnerabilities using:
- GitHub Dependabot (automated PR for security updates)
- `pnpm audit` (manual check)

If you notice a vulnerable dependency, please:
1. Open an issue with details
2. Or submit a PR updating the dependency

## Responsible Disclosure

We follow responsible disclosure practices:
1. You report a vulnerability privately
2. We confirm and develop a fix
3. We release a patch
4. We publish a security advisory
5. You receive credit (unless you prefer anonymity)

Thank you for helping keep OpenClaw CRM secure!

## Contact

- **Security email:** security@openclaw-crm.dev
- **GitHub Security Advisories:** https://github.com/giorgosn/openclaw-crm/security/advisories
- **General questions:** https://github.com/giorgosn/openclaw-crm/discussions
