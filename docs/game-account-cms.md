# Game Account CMS — dynamic attributes

This change uses the backend Game Account APIs merged in Zetruv backend PR #57.
No game-specific attributes are hardcoded into CMS.

## Admin workflow

1. Catalog → Games → **Account fields** on the game (for example, Mobile Legends).
2. Create field definitions: key, label, Text / Number / Boolean / Select /
   MultiSelect, select options, required, active, card visibility, and order.
3. Catalog → Products → New product → Game Account category → select the game.
   Save the product. A game selection is required for Game Account listings.
4. Reopen the saved product, then fill **Account attributes** for this listing.
   The existing Variants panel controls stock and pricing separately.
5. Public PDP displays all active attributes; catalog/homepage cards display only
   active populated fields marked Show on card. Frontend storefront must consume
   the backend `accountDetails.attributes` array (not fixed rank/region fields).

Changes to definitions do not overwrite other listings. Backend rejects invalid
types/options and any schema edits that would invalidate existing stored values.
Deactivating a field hides it publicly, but preserves values for reactivation.
Historical unlinked listings are read-only and require a new game-linked listing.

The CMS form never handles buyer credentials; checkout input fields remain
separate. No backend migration, email provider setup, or production deployment
is included in this frontend change.

## Validation

`node --test src/admin/gameAccountValues.test.js`
`npm run build:all:dev`
`npm run build:all:staging`

Admin requires an authenticated CMS admin session. The backend integration suite
already covers per-game isolation, validation, public projections and legacy migration.
