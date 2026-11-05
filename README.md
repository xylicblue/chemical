# Aster Chemicals

Original chemical company website built with React 19, Tailwind CSS 4, and Vite. Aster is a working name. All company details are replaceable sample content.

## Run locally

```powershell
cd D:\University\LUMS\internship\chemicals-studio
npm install
npm run dev
```

Website: `http://127.0.0.1:4173/`

Content studio: `http://127.0.0.1:4173/studio/`

```powershell
npm test
npm run build
npm run preview
```

The production build is in `dist/`. The project uses exact dependency versions and a committed npm lockfile. No third-party animation or icon packages are used.

## Client editing

1. Open `/studio/`. On the first visit, enter the one-time setup code supplied privately in the delivery message and choose a shared password of at least 14 characters. The code expires after seven days and is removed after use.
2. Select a section, change the content, and review the preview. Desktop and mobile preview are available.
3. Use **Save draft** to save without changing the public website. Use **Publish changes** to make the draft live.
4. Use **Publishing history** to restore an earlier version as a draft. The most recent 30 published versions are retained.

The editor manages branding, navigation, homepage text, imagery, product categories and details, visibility, featured order, industries, approach steps, contact information, footer, privacy notice, and product information notice. The inquiry inbox supports new/reviewed statuses. Backups can be downloaded and imported. Local work is recoverable after signing in again. Conflicting server saves are rejected rather than silently overwriting another editor.

The shared password can be changed in Overview. This invalidates all current editor sessions. Sessions expire after eight hours and are kept only in memory in the browser. Locking the studio revokes that session. There are no public user accounts and Supabase Auth is not used.

### Supply partner ticker

The **Supply partners** section appears directly above the product catalogue. In the studio, choose **Supply partners** to:

- Edit the heading and optional supporting note, or hide the whole section.
- Add, remove, reorder, or hide individual partner cards, up to 40 entries.
- Choose **Text name** or **Logo image** for each partner. Names remain required for accessibility and serve as a fallback if a logo cannot load.
- Upload JPG, PNG, or WebP logos up to 5 MB, or paste an HTTPS image URL. Transparent PNG or WebP logos work best.
- Enable or disable continuous scrolling, choose its speed, and change direction.

Visitors can pause the ticker. Hovering pauses movement, and reduced-motion preferences produce a static, horizontally scrollable row. A single visible partner stays still. Hidden or empty partner lists do not leave an empty section.

Partner changes use **Save draft** and **Publish changes**, including logo URLs stored in Supabase. Old drafts and history entries without a partner section load safe placeholder defaults without changing their saved content. Replace the sample names with confirmed partners and remove the sample note before presenting them as actual suppliers. Logo uploads use the existing protected image endpoint, and no new frontend environment variables are needed.

## Supabase

Project reference: `vutiqwxelirslgcnvhsn`.

`public/config.js` contains the public function URL, not an API secret. The server-only service credential is provided by Supabase to the Edge Function. No privileged key is bundled into the website.

Database definitions are in `supabase/schema.sql`. They have been applied to the connected project. Public and authenticated Data API roles have no access to the CMS tables. RLS is enabled on every table with default-deny access. The Supabase advisor may report informational “RLS Enabled No Policy” notices: this is intentional because the authenticated Edge Function handles access and uses the server-only service role.

- `cms_live`: published content
- `cms_draft`: draft content and optimistic revision number
- `cms_history`: published snapshots
- `cms_settings`: salted PBKDF2 password hash and hashed one-time bootstrap code
- `cms_sessions`: hashed expiring editor tokens
- `cms_rate_limits`: atomic request limits
- `cms_inquiries`: private inquiry records
- `website-images`: public display images, with server-authenticated uploads only

The `chemicals-cms` Edge Function exposes public content and inquiry submission, and protects all editorial actions with random session tokens. Passwords are derived with PBKDF2-SHA-256 and 210,000 iterations. Login, setup, and inquiries have server-side rate limits. Images are limited to 5 MB, checked by MIME type and file signature, and stored under randomly generated filenames.

The function's platform JWT check is disabled intentionally because there are no Supabase Auth users. The function verifies its own editor sessions for protected operations. CORS permits only the hosted site and the configured local development origins. A custom domain must be added to the function's `origins` list before use.

For subsequent backend deployments, run `node scripts/prepare.mjs` to sync the shared content validator into the function directory, then deploy all four files in `supabase/functions/chemicals-cms/` with `verify_jwt=false`.

If the initial setup code expires or the shared password is lost, a project administrator can generate a new random setup code, store its SHA-256 hash in `cms_settings.bootstrap_hash`, set `bootstrap_expires`, clear `password_hash` and `password_salt`, increment `generation`, and revoke `cms_sessions`. Never put a recovery code or password in tracked source.

## Launch notes

The hosted review site is private to its owner. Opening the public website itself does not require an application account, but the review hosting layer currently does. A client launch can use a public host and custom domain later.

Before public launch, replace the demonstration name, contact details, sample product information, and template privacy notice. Remove the template disclaimer after reviewing the content. Inquiry submissions are saved to the studio inbox; email notifications are not configured.

Responsive layouts cover small phones, tablets, desktop, and wide displays. Reduced-motion preferences are respected. Dialogs support keyboard navigation and Escape. The hero image is original generated artwork, documented in `ARTWORK.md`.
