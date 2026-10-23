# Architecture rules
- Technical order intake lives in a typed browser-safe module and is stored in orders.technical_data; keep device credentials and internal notes out of customer PDFs and public queries.
- Preserve graphics order fields and production statuses when adding technology workflows so existing orders remain editable.
- Resolve application privileges exclusively from public.user_roles; profile fields and email addresses must never grant access.
- Role-check SQL helpers use a fixed search path and security-definer reads to avoid recursive RLS; order item replacement runs as the authenticated caller so table policies still apply.
- The storefront progressively reveals the full available catalog with an intersection observer and a manual fallback, without duplicating products.