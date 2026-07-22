---
name: Deep Focus
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#ffb695'
  on-tertiary: '#571f00'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  stack-gap: 12px
  section-gap: 48px
---

## Brand & Style
The design system is engineered for high-performance productivity and cognitive clarity. It targets professionals who require an unobtrusive, "air-tight" interface to manage complex meeting intelligence. The aesthetic is a fusion of **Modern Corporate** and **Minimalist Utility**, drawing inspiration from the precise density of developer tools and the polished finish of premium consumer hardware.

The emotional goal is "Quiet Authority." By using a dark-by-default environment, the UI recedes, allowing the user's focus to remain entirely on the meeting content and AI insights. Visual flourishes are stripped away in favor of structural integrity, crisp lines, and logical information grouping. There is no room for decorative "AI magic" tropes; instead, intelligence is signaled through functional density and impeccable alignment.

## Colors
The palette is built on a "True Dark" foundation. The background utilizes a deep slate-black to minimize eye strain and maximize the perceived contrast of text. 

- **Primary:** A refined Indigo (#4F46E5) serves as the singular point of intent. It is used sparingly for primary actions and active states to maintain its visual impact.
- **Surfaces:** Depth is achieved through "Ink Levels"—layering shades of charcoal and slate. Higher elevation components use slightly lighter fills to indicate proximity to the user.
- **Accents:** Semantic colors (Success, Warning, Error) are desaturated to ensure they don't disrupt the monochromatic calm of the interface unless an action is required.

## Typography
This design system relies on **Inter** for its neutral, highly legible character, and **Geist** for technical data and labels to provide a subtle "tool-like" feel. 

Hierarchy is established through tight scale and deliberate weight shifts rather than color. 
- **Display and Headlines** use tighter letter spacing and semi-bold weights to feel "locked in."
- **Body Text** defaults to 14px to allow for high information density without sacrificing readability.
- **Captions and Labels** utilize Geist to distinguish between human-generated content (Inter) and system-generated metadata or AI labels.

## Layout & Spacing
The layout follows a **Rigid Grid System** with a 4px baseline unit. 

- **Desktop:** A 12-column fluid grid is used for main dashboards, with a fixed 280px sidebar for navigation. 
- **Density:** Information is packed tightly. Margins within cards are consistently 16px or 20px to maximize the canvas for transcripts and insights.
- **Reflow:** On smaller screens, sidebars collapse into a bottom navigation bar or a hamburger drawer. Multi-column dashboard widgets stack vertically, prioritizing the "Live Transcript" or "Meeting Summary" views.

## Elevation & Depth
Depth is communicated through **Low-Contrast Outlines** and **Subtle Tonal Layering**. 

1. **Base Layer:** The deepest background (#020617).
2. **Mid Layer (Cards/Panels):** Slightly lifted using a subtle fill (#0F172A) and a 1px solid border (#1E293B). 
3. **Top Layer (Modals/Popovers):** Higher elevation is signaled with a soft, 20% opacity black shadow (0px 12px 24px) and a semi-transparent background blur (8px) to create a "glass" effect that suggests focus.

Avoid heavy drop shadows on standard UI elements. Borders should be the primary method for defining object boundaries.

## Shapes
The shape language is **Soft** but disciplined. 

- **Standard Elements:** 4px (0.25rem) radius for buttons and input fields to maintain a professional, architectural feel.
- **Containers:** 8px (0.5rem) radius for cards and larger panels to provide a subtle visual softening against the dark background.
- **Interactive States:** Subtle 1px inner-glows on hover for buttons to simulate a physical "lit" edge.

## Components
- **Buttons:** Primary buttons are solid Indigo with white text. Secondary buttons are "Ghost" style (border only) or subtle slate fills. No gradients are permitted.
- **Input Fields:** Dark background (#020617) with a 1px border. Focus state is a 1px Indigo border with a very subtle outer glow.
- **Cards:** Defined by a 1px border (#1E293B). Header sections within cards should be separated by a hairline divider.
- **Chips/Badges:** Small, 4px rounded shapes with low-saturation backgrounds. Used for "Action Items," "Sentiment," or "Speaker Tags."
- **Lists:** High-density rows with 8px vertical padding. Use a subtle hover highlight (#1E293B) to indicate interactivity.
- **AI Specifics:** AI-generated text or summaries should be clearly delineated by a "Geist" font label and a subtle left-accent border in Indigo. Avoid "sparkle" icons; use a minimal "AI" text tag or a simple geometric icon.