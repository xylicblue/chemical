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

Public pages show a navy skeleton layout until published content arrives. They never render the local template as a loading or error fallback. Requests time out after 15 seconds and offer a retry; leaving the page cancels the request. Studio previews wait for the editor to send their draft. Hero and logo images keep a shimmer placeholder until the actual file loads, and reduced-motion preferences disable the shimmer. This is a frontend behavior change and does not update saved website content or draft revisions.

## Client editing

In **Homepage introduction**, use **Headline accent phrase** to highlight an exact part of the headline in muted sage. Leave it blank to keep the headline white. The supporting description and main button label remain editable there too. Accent styling and spacing do not change the hero image crop.

The homepage Products section lists all visible product names in the same order as Studio, with 12 products per page. Product names use a compact navy and pale blue treatment, without descriptions, formulas, or specifications in the list. Pagination changes the displayed items within the section, with previous/next controls, numbered pages, and a result count. Selecting a product opens the smaller single-product detail modal. Closing it preserves the current page and returns focus to the selected product.

The directory has a compact, rounded search field on the right of its navy header, alongside the product count. It searches product names across the full visible collection before pagination and returns to page one when the query changes. Category filters, the large search modal, and the material ticker remain removed. In **Product catalogue**, use Move up and Move down to order products, and Visible on website to include or hide them. All visible products are included, regardless of earlier popular/featured settings. Edit the Products section heading, introduction, empty-collection copy, and quote-button label in the catalogue section copy. Earlier catalogue labels and featured settings remain in saved data for backup compatibility. The separate company industries section remains editable.

To test pagination with extra products, open `/?catalogue-demo=1#products`. This opt-in preview adds up to 24 clearly labelled sample entries without changing saved products or drafts. Samples show preview-only product details and cannot send quote requests. Exit preview returns to the real catalogue. The standard website URL never adds these samples.

Product detail modals lead with a navy name header, the client's description, and a direct quote button. Sage-tinted supply information gives buying details a clear hierarchy. Detailed specifications, CAS numbers, and document availability stay in this view. Chemical formula displays remain removed; existing formula data remains in saved content and backups. See [the product presentation research](PRODUCT_PRESENTATION.md) for the design rationale.

Available grades, purity or concentration, specifications, packaging, origin, manufacturer, minimum order quantity, and applications are optional. Blank fields stay hidden. Each optional field has a **Show on website** checkbox for that material, including CAS, description, note, TDS, and SDS. Turning it off retains its saved value while hiding it from the product detail modal. This is a display setting, not confidential storage: published content remains part of the public content response. Company name and product identity are not changed. Products section headings and introduction are editable in Studio.

Set TDS and SDS availability independently. Optionally paste an HTTPS URL to the current document. **Available** with a URL shows a document link; without a URL it displays **Available on request**. New and legacy entries default to **Request availability**. PDF uploads are not part of the image upload control. The quote button opens the inquiry form with the selected product name already filled in. Quote and detail button text can be edited in the catalogue section copy.

In **Brand & navigation → Company logo**, choose an uploaded image, editable initials, or a hidden logo mark. Upload a JPG, PNG, or WebP up to 5 MB, or paste an HTTPS image URL. Transparent PNG or WebP artwork works best on the navy background. Header and footer use the same logo, with initials as a fallback if the image fails to load. Save or publish through the normal workflow.

The **Hero statistics** section controls the figures displayed at the base of the hero. Edit each number and label, reorder or remove entries, add up to four figures, or hide the panel. The initial `00+` values are placeholders for confirmed company figures. Changes use the normal draft, preview, and publish workflow. Existing content gains these settings without replacing any client text.

The **Company & principles** section controls the introduction and benefit cards above the supply partner ticker. Every card uses the same navy background and centered white heading. On devices with a fine pointer and hover, the heading moves up slightly and reveals the description on hover or keyboard focus. Descriptions stay visible on touch screens, and reduced-motion preferences remove transitions. Card space is reserved for the full description, including client edits, so revealing it does not move neighboring cards. Headings, descriptions, note, and card order remain editable. The Popular materials description sits below its heading on every display size.

1. Open `/studio/`. On the first visit, enter the one-time setup code supplied privately in the delivery message and choose a shared password of at least 14 characters. The code expires after seven days and is removed after use.
2. Select a section, change the content, and review the preview. Desktop and mobile preview are available.
3. Use **Save draft** to save without changing the public website. Use **Publish changes** to make the draft live.
4. Use **Publishing history** to restore an earlier version as a draft. The most recent 30 published versions are retained.

The editor manages branding, navigation, homepage text, imagery, product details, visibility and ordering, industries, approach steps, contact information, footer, privacy notice, and product information notice. The inquiry inbox supports new/reviewed statuses. Backups can be downloaded and imported. Local work is recoverable after signing in again. Conflicting server saves are rejected rather than silently overwriting another editor.

The shared password can be changed in Overview. This invalidates all current editor sessions. Sessions expire after eight hours and are kept only in memory in the browser. Locking the studio revokes that session. There are no public user accounts and Supabase Auth is not used.

### Supply partner ticker

The **Supply partners** section appears directly above the product catalogue. In the studio, choose **Supply partners** to:

- Edit the heading and optional supporting note, or hide the whole section.
- Add, remove, reorder, or hide individual partner cards, up to 40 entries.
- Choose **Text name** or **Logo image** for each partner. Names remain required for accessibility and serve as a fallback if a logo cannot load.
- Upload JPG, PNG, or WebP logos up to 5 MB, or paste an HTTPS image URL. Transparent PNG or WebP logos work best.
- Enable or disable continuous scrolling, choose its speed, and change direction.

The ticker has no public pause button. Hovering pauses movement, and reduced-motion preferences produce a static, horizontally scrollable row. A single visible partner stays still. Hidden or empty partner lists do not leave an empty section.

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
