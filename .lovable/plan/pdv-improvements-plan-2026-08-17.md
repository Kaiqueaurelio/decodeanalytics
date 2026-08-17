# PDV Improvements Plan

The current PDV feels disconnected from the rest of the application's premium aesthetic (deep navy, brand yellow, high-contrast cards). It also has a cluttered layout that hinders speed, which is critical for a point-of-sale system.

## Proposed Changes

### 1. Visual Alignment
- **Theme Sync**: Replace the generic light blue background with the app's standard deep navy (`#080c16`) for sidebars and high-contrast white cards for the main operation area.
- **Typography**: Standardize on the "A" logo style and the uppercase tracking used in `AppShell`.
- **Polish**: Use the same glow effects for active states and subtle borders (`white/[0.05]`) seen in the administrative sidebar.

### 2. Layout Optimization (Mobile-First)
- **Compact Header**: Merge the "Frente de Caixa" header with the status indicators to save vertical space.
- **Unified Action Bar**: Group "Lançar Maquininha", "Venda Rápida", and "Calculadora" into a single, elegant floating or sticky action bar.
- **Improved Cart**: Redesign the cart items to be more compact, using a list view that mimics a real receipt rather than large blocky cards.

### 3. Functional Enhancements
- **Quick Access Categories**: Replace the text-based category filter with icon-based circles (similar to the storefront landing page) for faster navigation.
- **Search Optimization**: Make the search bar more prominent and add "Scan" simulation (focusing the search bar by default).
- **Checkout Flow**: Simplify the payment selection. Instead of a large dialog, use a "Drawer" or a multi-step slide-in that feels more integrated.

## Technical Details
- Update `src/routes/_authenticated/pdv.tsx` to use the design tokens defined in `src/styles.css`.
- Refactor `QUICK_PRODUCTS` and `CATEGORIES` to better reflect a print shop's daily reality (e.g., adding "Serviços Expressos").
- Ensure `pdv-cart` uses `overflow-x: clip` to prevent horizontal leaks on small mobile screens (iPhone 11/13).
