---
description: Food Fabricator Feature Implementation logic
---
# Food Fabricator Logic

The Food Fabricator is a sci-fi themed customization interface.

## Components
- **Fabricator.jsx**: Main container. Handles two views:
  1. **Selection Grid**: Lists items using `HologramCard`.
  2. **FabricatorInterface**: The customization mode.

- **FabricatorInterface**:
  - **Left Panel**: Specs and current modifications list.
  - **Center**: Food image with overlay animations (laser scan, blueprint grid).
  - **Right Panel**: Ingredient list derived from `INGREDIENTS_DB` based on category.

## Key Functions
- `scanAndAdd(ingredient)`: 
  - Triggers the laser animation (CSS class `laser-scanner`).
  - Updates the text terminal with "Materializing..." messages.
  - Adds ingredient to the `customizations` array after delay.

## Styles
- Located in `Fabricator.css`.
- Uses heavy cyan/magenta neon colors (`#0ff`, `#ff00ff`).
- Grid backgrounds and scanlines for retro-futuristic feel.

## Usage
- Accessed via the "Fabricator" button in the Navbar.
- Can be extended by adding more categories to `INGREDIENTS_DB`.
