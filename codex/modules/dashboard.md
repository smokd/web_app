# Dashboard Module

The dashboard is `src/app/page.tsx`; `/dashboard` redirects to it. It aggregates Harvest, FieldReject, PackhouseLoad, PackhouseReject, and RejectType data into KPI cards and Recharts components from `src/components/charts.tsx`.

Harvest actions revalidate `/dashboard`; any data-flow change affecting these aggregates must retain that invalidation.
