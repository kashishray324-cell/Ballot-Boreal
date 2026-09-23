# Layouts

## `src/App.tsx`

The root shell renders the global header, voter-step rail, central disclosure workflow, wallet/policy utility rail, and footer. It is the project’s sole shared layout.

```tsx
export default function App() {
  // Header → workspace (step rail, content, utility rail) → footer.
  // Full implementation is in src/App.tsx and owns current route-free layout.
}
```
