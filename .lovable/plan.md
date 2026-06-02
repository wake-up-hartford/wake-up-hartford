## Light/Dark theme toggle

The stylesheet already defines both themes (`:root` = light, `.dark` = dark), so no token rework is needed.

### Changes
1. **New** `src/components/theme-toggle.tsx` — a small floating sun/moon button (fixed top-right) that toggles the `dark` class on `<html>` and persists choice in `localStorage` under key `theme`. Defaults to dark to match current behavior. Renders only after mount to avoid SSR hydration mismatch.
2. **Edit** `src/routes/__root.tsx` — import `ThemeToggle` and render it inside `RootComponent` next to `<Outlet />`. The `<html className="dark">` default stays so first paint is unchanged; the toggle component will update the class on the client based on stored preference.

### Result
Click the icon (top-right) to flip between dark and light live. Preference persists across reloads. Removing the feature later = delete one component + one import.