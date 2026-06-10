# Prestige POS — Website

Marketing landing page + public **Terms** and **Privacy** pages for Prestige POS,
themed to match the app (lib/design_system/colors.dart).

- Framework: Next.js 14 (App Router) + Tailwind CSS + TypeScript
- Pages: `/` (landing), `/terms`, `/privacy`
- Domain: **prestigeitsolutions.tech**

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Build

```bash
npm run build && npm start
```

## Deploy

Easiest is **Vercel** (free): push this folder to a GitHub repo, import it in
Vercel, and point the domain `prestigeitsolutions.tech` at it. The App Store
Privacy URL will then be:

```
https://prestigeitsolutions.tech/privacy
```

## Notes

- This is a **separate** project from the Flutter app repo — keep it in its own
  Git repository.
- Features shown intentionally exclude books/retail-catalog, co-working, and
  memberships (those are store-specific packs, not core marketing claims).
