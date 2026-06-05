## Add animated triangle of 3 colored circles on /preview

Insert a new section directly under the tagline (between line 42 and the Hero section) showing 3 equal-size circles that fly in one after another and settle into a triangle arrangement.

### Layout
- Triangle: two circles on top row (Your Neighborhood = gold left, Your Home = purple right), one circle centered below (Your Life = blue).
- Equal sizes: ~9rem (w-36 h-36) on mobile, ~11rem on sm+ screens.
- Centered horizontally, with appropriate vertical/horizontal spacing so they read as a triangle.
- Each circle: solid brand color background, white bold display-font label centered, soft shadow.

### Colors (from existing tokens in styles.css)
- Gold → `bg-gold text-gold-foreground` → "Your Neighborhood"
- Purple → `bg-primary text-primary-foreground` → "Your Home"
- Blue → `bg-accent text-accent-foreground` → "Your Life"

### Animation
- Use Tailwind's existing `animate-fade-in` and `animate-scale-in` keyframes (already defined in the project) combined with staggered `animation-delay` inline styles via `style={{ animationDelay: "Xms" }}`.
- Circle 1 (Your Neighborhood): 100ms delay
- Circle 2 (Your Home): 400ms delay
- Circle 3 (Your Life): 700ms delay
- Each starts hidden (`opacity-0`) and animates in with a combined fade + scale effect (`animate-[fade-in_0.5s_ease-out_forwards,scale-in_0.5s_ease-out_forwards]`).

### Technical notes
- Implement as a small inline `<section>` in `src/routes/preview.tsx`; no new files, no new dependencies.
- Use flex layout: outer column, top row = flex with gap between two circles, bottom row = centered single circle slightly overlapping/below.
- Text inside circles uses `font-display` and `text-center` with small/medium sizes that fit (e.g., `text-sm sm:text-base font-semibold leading-tight px-3`).
- No changes to business logic, routes, or any other section.
