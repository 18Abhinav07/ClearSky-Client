src/
│
├── app/
│   ├── providers/          # App-level providers (Wagmi, QueryClient, Theme)
│   ├── router/             # App routing setup
│   └── store/              # Zustand/Jotai global state
│
├── pages/                  # All route screens
│   ├── Login/
│   │    └── index.tsx
│   ├── Signup/
│   │    └── index.tsx
│   └── Dashboard/
│       └── index.tsx
│
├── components/             # Reusable UI components
│   ├── ui/                 # Buttons, Inputs, Modals
│   ├── layout/             # Navbar, Sidebar, Footer
│   └── shared/             # Dropdowns, form elements, cards
│
├── services/               # Backend + SDK integrations
│   ├── api/                # All API services live here
│   │    └── auth.service.ts   # <-- only one service currently
│   │
│   ├── sdk/                # External SDKs (empty for now)
│   │    └── index.ts
│   │
│   └── index.ts            # Exports for all services
│
├── hooks/                  # Reusable hooks
│   ├── useAuth.ts          # Optional wrapper around auth.service
│   └── useFetch.ts
│
├── utils/                  # Utility helpers, formatters, validators
│   ├── validators/
│   │    └── authValidators.ts
│   ├── formatters/
│   └── helpers.ts
│
├── config/                 # Environment config, constants
│   ├── env.ts
│   └── routes.ts
│
└── types/                  # TS interfaces + types
    ├── auth.types.ts
    └── global.ts
