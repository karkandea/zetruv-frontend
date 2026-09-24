# Game Account public storefront — live dynamic data

Backend source of truth: Zetruv backend PR #57. This frontend change uses
`accountDetails.attributes` for every game's listings and does not assume
Rank, Region, Skin, Level, MMR, Arcana or Starlight fields are always present.

## Routes

- `/`: homepage Game Account cards from `GET /api/v1/homepage`;
  up to three real returned records, with truthful empty state.
- `/game-accounts` and `/search?kind=GameAccount`: live game picker
  from `GET /api/v1/catalog/games`.
- `/game-accounts/{gameSlug}`: paginated game-filtered catalog from
  `GET /api/v1/catalog/products?kind=GameAccount&game={gameSlug}`.
  Availability uses API `isAvailable`; page-local sorting and status
  filters do not pretend to be a global stock count.
- `/game-accounts/{gameSlug}/{productSlug}`: live
  `GET /api/v1/catalog/products/{productSlug}` detail. A slug from
  another game is rejected. Detail displays all populated active fields;
  cards display only `showOnCard` fields. Boolean false and numeric
  zero remain visible; unset and unknown values never gain filler text.

Stock, pricing, seller images, rating and sold quantity are derived from
the current API response, not static examples. Missing media and missing
data use honest placeholders. Unavailable listings remain inspectable.

## Boundary

The existing `?flow=account` cart/checkout/payment screens elsewhere
in the repository still contain preview data. This change deliberately
does **not** link a real listing to those preview routes, issue a fake
invoice, or imply that a payment has occurred. The real PDP displays a
disabled purchase CTA until authenticated account-cart and checkout
wiring is delivered as a separate scope. Backend Game Account stock
remains one unique unit.

The shared frontend worktree's uncommitted `SearchPage.jsx` and
`search.css` changes were not modified. This branch is based on
`origin/dev` and confines product routing to the existing
Game Account routes in App.jsx.

## Checks

- `node --test src/services/gameAccountPresentation.test.js`
- `npm run build:all:dev`
- `npm run build:all:staging`
- Home, picker, listing and detail require a representative CMS test
  listing for end-to-end visual testing. DEV currently has zero public
  Game Account listings, so its empty state is expected until one is created.
