# Visual System

The diagram is inline SVG inside an HTML page: vector, light and dark themes, lossless export. No libraries, no external images or fonts.

Always start from `assets/template.html`, which already has the stylesheet, icons and arrow markers. This document explains **why** it is built that way, which is what you need to extend it without breaking it.

## From architecture.md to the Drawing

Each column of the tables has exactly one visual attribute, so the reader can check the drawing against the authority:

| Column | Attribute | Values |
|---|---|---|
| Boundary | Border stroke | `inside`: solid · `outside`: dashed (`card-dash`, `zone-p`) |
| State | Border color | `exists`: its role color · `to_create`: orange (`card-o`) |
| Kind | Arrow class | `public` `ed-pub` · `deploy` `ed-ci` · `private` `ed-priv` · `dependency` `ed-dep` · `internal` `ed-int` · `telemetry` `ed-tel` · `local` `ed-loc` |
| Zone | Zone box | one zone rectangle per distinct value |
| `to confirm:` cell | Text color | pending (orange) text with the words "to confirm" |

## What Decides Whether the Diagram Looks Good

Not the palette or the icons. **The routing of the arrows.** Lines that cross, start at an ambiguous point or run under a box read as careless even when everything else is impeccable, and worse, they read wrong: an arrow leaving at the height of the wrong box says something false.

### The central component radiates

Find the component that talks to everything else. It is almost always the backend: it receives from the frontend, queries databases, calls external services, receives deployments.

Place it so **each outgoing arrow goes in a different direction**, and arrange the zones around it so no arrow has to cross another:

```
                    ┌──────────┐   ← CI/CD enters from the right
   frontend  ──────▶│          │──────▶  external services (right)
                    │  Backend │
   internal net ◀───│          │
      (left/below)  └────┬─────┘
                         │
                         ▼
                   private data (below)
```

If two arrows need the same side, move a zone before accepting the crossing.

### Orthogonal, through the corridors

Route in horizontal and vertical segments, never diagonal or with long curves. Use `<polyline>` with explicit points.

Leave **corridors** of 20 to 30 pixels between zones and route long runs through them. The margin between the outer container and the first zone is a vertical channel for an arrow that must cross the whole height without passing through anything.

```xml
<!-- down, across the corridor, down the left channel, in -->
<polyline class="ed-int" data-edge="api>legacy-db" points="620,424 620,460 42,460 42,1000 78,1000"
          marker-end="url(#ar-orng)"/>
```

End arrows 4 to 8 pixels before the target edge: the arrowhead needs room to read.

### Labels get a halo

A label that crosses a line or a border is illegible. Paint the text outline in the background color before the fill:

```css
.halo {
  paint-order: stroke;
  stroke: var(--dg-bg);
  stroke-width: 4px;
  stroke-linejoin: round;
}
```

It punches cleanly through whatever is underneath, so you do not have to find a perfect gap for each text. Apply it to every arrow label, zone title and label sitting on a group border.

### One attribute, one dimension

The dashed border means **"not part of this deployment"** everywhere: resources that already exist, third-party systems, other people's networks. Once a dashed border means two things ("existing" in one place, "optional" or "grouping" in another) the reader stops trusting the encoding and has to read every box.

One nuance works: a **dashed zone** because the network belongs to someone else, with a **solid box** inside because you do deploy that resource. It reads well and says something true.

A second dimension goes to a different attribute, as the table above does with state on the border color. When you finish, walk the diagram asking of each dashed border *"is this outside the deployment?"*; any "no" is the inconsistency.

Declare the encoding in the diagram itself, in a line by the title or in the legend, so a reviewer can verify it without guessing.

## Color Coding

Each connection kind has its own color and stroke, and appears in the legend. The names are roles, not tones, so the meaning survives a palette change.

| Role | Stroke | Use |
|---|---|---|
| Public | Solid, blue | User traffic over the internet |
| Deploy | Dashed, blue | Pipelines, image publishing |
| Private | Solid, teal | Virtual network, private endpoints |
| Dependency | Dashed, purple | Existing services, egress to the internet |
| Internal | Dashed, amber | Corporate network through a tunnel |
| Telemetry | Solid, grey | Logs and metrics |
| Local | Dotted, ink | Same host or process |
| Pending | Amber text | What is still to confirm |

Pending sharing a color with internal does not get in the way: one is a line stroke and the other a text color, and context separates them. If it clashes in a given diagram, move pending to another tone and update the legend.

## Typography

Two families, each with a job:

- **Resource names** in monospace. They are identifiers someone will type into a portal or a script.
- **Everything else** in the system sans.

The template uses the Segoe family with system fallbacks, so nothing is downloaded; a font that fails to load degrades silently.

Size scale, in `viewBox` units:

| Element | Size | Weight |
|---|---|---|
| Zone title | 15.5 | 650 |
| Resource name | 12.5 | 650 |
| Identifier | 11.5 | 400 |
| Detail | 11 | 400 |
| Note | 10.5 | italic |
| Arrow label | 10.5 | italic |

Stay at 10.5 or above: exported to PNG and shrunk into a document, anything smaller becomes illegible.

## Grid

Work on an explicit grid. Misalignments by eye are half of what makes a diagram look improvised.

- `viewBox` around `1560 × 1160` for a full topology. Adjust the height to the content.
- Columns: a wide one on the left (≈ 850) and a narrow one on the right (≈ 570), separated by a 30 corridor.
- Resource boxes: 62 to 124 high depending on their lines, corner radius 7.
- Inner text: first line 24 from the top edge, then every 17 or 18.
- Icon on the left, 40 × 40, with the text starting about 50 to its right.

Before calling a zone done, check that **both columns end at the same height**. A short column leaves a dead gap that unbalances everything; stretch one zone or move another.

## Light and Dark Themes

Define every color as a variable on `:root` and style only through them. The viewer has three states (light, dark, and "system", which marks nothing), so three blocks are needed:

```css
:root { /* full light palette */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* only redefine variables */ }
}

:root[data-theme="dark"] { /* again, so the explicit selector wins */ }
```

A color declared only inside a media query or `[data-theme]` block does not apply in the unmarked state, and the page paints one theme's text on the other's background. Give `body` an explicit background, because a transparent one inherits the viewer's.

The export script resolves the first `:root` block onto the SVG root element, so the light palette must be complete there.

## Check Before Delivering

- No arrow crosses another or runs under a box.
- Each arrow starts at the edge of the right component, not near it.
- Each arrow label sits by its arrow and touches no other.
- The dashed border means the same everywhere.
- Both columns end at the same height.
- The legend covers every stroke used, and no more.
- Pending items are marked and distinguishable.
- In the `containers` view, every person, container and relation appears with its `data-node` or `data-edge`; no box is invented.
- Every other view says only what the tables say, at its own zoom: the `context` view merges the system's containers into one box, and a `components` view draws the boxes its architecture rule names.
- Each view carries its own legend with only the strokes it uses.

Render the PNG and **look at it** before delivering. Text overlaps are invisible in the source and obvious in the image: two adjacent labels touching, a long string overflowing its box, a title colliding with a badge.
