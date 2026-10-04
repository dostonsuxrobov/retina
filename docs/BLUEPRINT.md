# Blueprint v1

The first prototype takes a JSON blueprint as input. In the early workflow, a person or image model can create this file from a reference image; the app validates the blueprint and deterministically builds the supported geometry in the browser.

## Supported shape

Version 0.1 supports one centered rectangular plate with rounded corners and circular through-holes. Dimensions are in millimetres. The plate lies in the XY plane, centered at `(0, 0, 0)`; its thickness extends equally above and below the XY plane. Hole `x` and `y` coordinates use the same centered origin.

```json
{
  "schema": "retina.blueprint/v1",
  "name": "Four-hole mounting plate",
  "units": "mm",
  "body": {
    "type": "plate",
    "width": 120,
    "height": 80,
    "thickness": 8,
    "corner_radius": 6
  },
  "features": [
    { "type": "through_hole", "x": -45, "y": -25, "diameter": 8 },
    { "type": "through_hole", "x": 45, "y": -25, "diameter": 8 },
    { "type": "through_hole", "x": 45, "y": 25, "diameter": 8 },
    { "type": "through_hole", "x": -45, "y": 25, "diameter": 8 }
  ],
  "evidence": {
    "observed": ["flat rectangular outline", "four circular holes"],
    "inferred": ["plate thickness is 8 mm", "corner radius is 6 mm"],
    "unknown": ["material", "exact dimensions unless supplied"]
  }
}
```

Optional `appearance.color` may provide a CSS hex colour. Evidence arrays record what is observed, inferred, and unknown; they do not alter geometry. When dimensions are not supplied with an image, mark estimates as inferred and say so.

## Current limits

The app rejects unsupported body and feature types, non-positive dimensions, and holes that cross the plate boundary. It does not infer scale or hidden geometry, and it does not yet support pockets, slots, countersinks, threads, multiple bodies, manufacturing tolerances, or materials. The GLB exporter converts millimetre blueprint dimensions to glTF metres.

## Try it

Open the GitHub Pages site, edit the sample, choose a `.json` file, or paste a blueprint and select **Build preview**. Drag to orbit and scroll to zoom. Export the validated geometry with **Export GLB**.

## Shed recipe (v0.2)

The app also accepts `retina.shed/v1`, and accepts the earlier `retina.shed/proposed-v1` file unchanged. See `site/examples/shed-blueprint.json` for the complete contract. Coordinates use +Z up, a centered floor at ground level, front -Y, and right +X. Dimensions are millimetres. Wall opening `center_offset` is world X for front/rear and world Y for right/left; `bottom` is height above ground.

Required sections are `body`, `roof`, `walls`, `trim`, `openings`, and `details`. The recipe supports a rectangular shed, vertical panel siding, a gable roof with ridge along Y, single/double doors, windows, glazing grids, shutters, simple flower boxes, strap hinges, gable vents, and a centered ridge cupola with a hip roof. Wall meshes have real opening cutouts. All opening dimensions must fit within the wall; overlapping openings are rejected. Export converts millimetres to metres as for plates.

This is an illustrative architectural model. It does not reproduce photographic textures, plants, framing, roof shingles, construction joints, or manufacturing tolerances. Measurements and hidden geometry are assumptions, recorded in evidence. The reference image alone establishes no physical scale.

## Modern shed extension (v0.3)

`roof.type: mono_pitch` supports a single roof plane across X, with `slope_axis: x`, `high_side: left | right`, and positive `rise`. `body.wall_height` is the low wall height; the high wall is `wall_height + rise`. Wall tops and opening validation follow the roof slope. Optional `roof.fascia_color` sets a separate fascia color.

`walls.style: horizontal_panel_siding` adds horizontal seams using `panel_spacing`. Doors accept `style: flush` and `glazing_panels`, an array of up to eight rectangles with `width`, `height`, and `bottom_from_door_base`. These cannot be combined with `top_glazing`. See `site/examples/modern-shed-blueprint.json`. Gable cupolas/vents are rejected for mono-pitch roofs. Upper glazing is currently rectangular; angled glazing, slabs and support blocks are not modeled by this recipe.
