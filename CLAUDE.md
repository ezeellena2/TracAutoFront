# TracAuto Frontend — Project Rules (Claude Code)

You are working on **TracAutoFront**, the main React frontend for TracAuto, a multi-tenant SaaS for automotive fleet management. Stack: React + TypeScript + Vite + TailwindCSS + i18next + React Query.

These rules are **non-negotiable**. Every piece of code you write MUST comply.

---

## Architecture

- **Monolith frontend**: all features (fleet, marketplace, rentals B2B/B2C) live in this single repo.
- **API calls**: always use `apiClient` (authenticated) or `publicApiClient` (public). Never use `fetch` or `axios` directly without going through the configured client with interceptors.
- **Routing**: protected routes must be wrapped in `ProtectedRoute`. B2C routes use a separate auth flow.

## Error Handling

- All API-calling screens must use `useErrorHandler`, `ApiErrorBanner`, `EstadoError`, or equivalent (toast/banner/retry based on context).
- The route tree must be wrapped in `ErrorBoundary` to catch React errors and offer recovery or reporting via `ISupportService`.
- Every list/detail page must handle: loading state, empty state, and error state.

## i18n (mandatory)

- All user-facing text must come from `es.json` / `en.json` via `useTranslation()`. No hardcoded strings.
- Error messages from backend follow nested format: `errors.{Contexto}.{Codigo}` with `{{param0}}`, `{{param1}}` interpolation.
- When adding new backend errors (in `DomainErrors`), always add the corresponding frontend translation entries.

## Result Pattern Integration

- Backend errors arrive as `ProblemDetails` with a `code` field following `{Contexto}.{NombreError}`.
- The error interceptor matches the code against `errors.*` in the translation files.
- Positional metadata (`param0`, `param1`) is used for interpolation.

## CQRS / Backend Contract Awareness

- Each backend use case is a separate Command or Query. Frontend services should mirror this 1:1.
- API contracts are stable. Do not change endpoint shapes without explicit BREAKING label.
- Prefer additive, backward-compatible changes (new optional fields, new endpoints).

## Multi-tenancy

- `organizacion_id` comes from the JWT claim, set at login. There is no organization selector.
- Each user belongs to exactly one organization. Multi-org per user is prohibited.
- Never expose tenant IDs, internal IDs, or PII in error messages or UI.

## Notifications Awareness

- Email notifications are sent from the backend via `INotificacionService`/`IAlquilerNotificacionService`.
- Frontend only triggers actions; it does not send emails directly.

## Cache Awareness

- Frequent queries may be cached (Redis) in the backend via `ICachedQuery`. Commands invalidate cache via `ICacheInvalidatingCommand`.
- After mutations, use React Query invalidation patterns to keep UI consistent.
- Be aware that list data may need a forced refetch after commands.

## States (mandatory for every page)

- **Loading**: show spinner or skeleton.
- **Empty**: show `EstadoVacio` component or equivalent.
- **Error**: show `EstadoError`, `ApiErrorBanner`, or equivalent with retry option.

## Clean Code

- No legacy or dead code. If something is not used, delete it.
- No commented-out code blocks in production files.

## Soft Delete Awareness

- Backend uses soft delete (`Activo` field). Frontend filters and lists show only active records by default.

## DTOs Only

- Backend never returns raw entities — always DTOs. Frontend should model its TypeScript types matching these DTOs.
- Never assume internal DB fields exist in API responses.

## Rate Limiting Awareness

- Public and sensitive endpoints may be rate-limited (HTTP 429). Frontend must handle 429 responses gracefully with user-friendly messaging and retry logic (exponential backoff or cooldown timer).

## Tenant-Scoped Configuration

- Each org has its own configuration (branding, Stripe keys, notification preferences, etc.) stored in the backend DB.
- Frontend reads this via queries like `GetConfiguracionAlquiler`. Never hardcode org-specific values.

## Time Handling

- Always display dates/times in the user's local timezone using proper formatting libraries.
- Backend stores all timestamps in UTC. Frontend converts to local time for display.

## Webhook-Driven Updates

- Some states change asynchronously via backend webhooks (e.g., Stripe payment confirmations).
- Use polling or WebSocket subscriptions where real-time updates are needed (payment status, reservation state changes).

## Security

- JWT access tokens are short-lived (~15 min). Refresh tokens are HttpOnly cookies.
- The API client interceptor handles automatic token refresh transparently.
- Never store tokens in localStorage. Never expose tokens in URLs or logs.
