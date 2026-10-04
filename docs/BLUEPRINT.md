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
