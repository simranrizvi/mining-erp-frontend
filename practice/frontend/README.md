# Mining ERP — Frontend

Next.js 16 (App Router, JSX) + Tailwind CSS + a hand-built shadcn-style component
library on Radix primitives. See the repository root `README.md` and `docs/` folder
for full setup instructions and architecture notes.

## Quick start

```bash
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Visit `http://localhost:3000`. Requires the backend API running (see `../backend/README.md`).

## Notable structure

- `src/hooks/use-resource.js` — generic list+CRUD hook backing every module page
- `src/components/shared/` — DataTable, EntityFormDialog, LineItemsEditor, etc.
- `src/components/ui/` — Button, Input, Dialog, Select, Table, Tabs... (shadcn-style)
- `src/context/auth-context.jsx` — session state, silent refresh, `hasPermission()`
