## Packages
framer-motion | Complex animations and page transitions
recharts | Dashboard analytics and risk charts
date-fns | Date formatting for incident reports
lucide-react | Icons for the interface (already in base, but emphasizing usage)
clsx | Conditional class merging
tailwind-merge | Class merging utility

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["Inter", "sans-serif"],
  display: ["Oswald", "sans-serif"], 
}
Colors:
- Primary: Safety Orange (#FF5722)
- Secondary: Industrial Charcoal (#263238)
- Accent: Caution Yellow (#FFC107)

Auth:
- Role-based access control implemented in frontend (Admin, Manager, Worker)
- Protected routes wrapper needed

API:
- All mutations invalidate 'incidents' or 'risks' queries
- Mock image upload using simple URL input for now
