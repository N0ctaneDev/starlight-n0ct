# Security Policy

Please report vulnerabilities privately through GitHub's Security Advisories feature. Do not publish exploit details in an issue before a fix is available.


## Temporarily accepted upstream dependency advisory

**CVE-2026-112366 / GHSA-fc5q-39xc-vjpf — picomatch ReDoS**

The current dependency graph contains the affected `picomatch` versions through 4.0.7, both directly and transitively through the Astro/Starlight/Vite toolchain. The advisory has no published patched version at the time of this change.

This is **not a security fix**. Until upstream publishes a fix:

- CI allows only this exact GHSA ID and package name.
- All other npm audit findings remain blocking.
- The allowlist is in `scripts/audit-deps.mjs` and expires on **2026-12-17** unless reviewed.
- Do not pass untrusted, user-controlled glob patterns to `picomatch` or APIs that use it. If an application feature must accept patterns, reject repeated extglob constructs or use a separately reviewed, resource-limited matching strategy.

When upstream releases a fixed version, update the dependency tree and lockfiles, remove the allowlist entry, and return to an unmodified `npm audit` gate.
