

## Plan: Restructure Hero Section + Fix Build Errors

### What we're building
Redesign the hero/carousel section into a two-column layout:
- **Right side**: Arabic text block with title "أسهم الفرحة", subtitle, and description
- **Left side**: The existing animated carousel images

### Changes

**1. Fix build errors** — Add type declaration file for CSS imports and fix TypeScript issues across multiple files:
- Create `src/types/css.d.ts` declaring modules for `.css` imports
- Fix implicit `any` types in carousel and product API routes
- Fix missing Prisma type exports by using inferred types instead

**2. Restructure hero section in `src/app/page.tsx`**:
- Replace the current single-column hero with a flex row layout (RTL)
- Right column: Title "أسهم الفرحة" in bold, tagline in quotes, descriptive paragraph
- Left column: The existing animated carousel images
- Responsive: stack vertically on mobile, side-by-side on md+

### Technical details

Hero section markup (simplified):
```text
┌─────────────────────────────────────────┐
│  [Carousel Images]  │  أسهم الفرحة      │
│  (animated, left)   │  "بمساهمتكم..."    │
│                     │  بفضل الله...      │
└─────────────────────────────────────────┘
        ← LEFT              RIGHT →
```

Uses existing Tailwind classes. Text styled with gradient or green theme colors to match the site's branding.

