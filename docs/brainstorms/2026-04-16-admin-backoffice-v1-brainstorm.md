---
date: 2026-04-16
topic: admin-backoffice-v1
---

# Admin Backoffice V1

## What We're Building
We add an admin backoffice for `findmyroom.be` with two roles:
- `super_admin` (initially `jim@la-brique.be`)
- `admin`

Admins get a dedicated backoffice experience:
- `Clients` tab: all user accounts + their listings
- global `Statistiques` tab: platform-wide KPIs + listing-level performance table
- listing moderation actions (pause/archive/delete), no full edit in V1

The app stays marketplace-first for users, with admin features isolated behind role checks.

## Why This Approach
Recommended approach: **database-backed roles** (`super_admin` / `admin`) with RLS-aware policies.

Alternatives considered:
- Hardcoded admin email in code: fast but fragile, not scalable.
- OAuth/claims-only role: harder to manage operationally.
- DB role table: best tradeoff for security + future growth.

This is the right choice because admin access controls data visibility and moderation powers. It must be auditable and revocable without redeploy.

## Key Decisions
- Role model: `super_admin` + `admin`.
- Bootstrap account: `jim@la-brique.be` becomes initial `super_admin`.
- Only `super_admin` can promote/revoke other admins.
- Promotion flow: from `Clients` tab on existing users only.
- Admin listing permissions in V1: moderation only (`pause`, `archive`, `delete`), no content edit.
- Admin analytics scope in V1: global KPIs + per-listing table (views, contacts, conversion proxy).
- Admin can access all data needed for operations (users, listings, events).
- `Supprimer` action in admin UI is mapped to `archive` (soft delete), not hard delete.
- Contact fields in `Clients` are masked by default, revealed only on explicit action.

## Minimal V1 Scope (YAGNI)
- Add role storage and helpers.
- Add role checks in server actions + pages.
- Add `Clients` admin screen.
- Extend `Statistiques` for admin global view.
- Add moderation controls in admin context.

Not in V1:
- Granular permissions matrix
- Team/organization model
- Audit trail UI (DB log can come later)

## Next Steps
→ Implementation plan: schema + RLS + server role guard + admin pages/actions.
