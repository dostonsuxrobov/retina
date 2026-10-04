# Project context

## Identity

- Name: Retina
- Owner: `dostonsuxrobov`
- Canonical repository: https://github.com/dostonsuxrobov/retina
- Git remote: https://github.com/dostonsuxrobov/retina.git

This file is durable project memory. Future sessions should read its current version together with `AGENTS.md` rather than rely solely on conversation history.

## Vision

Build an efficient visual perception/reconstruction layer: pixels become structured information that downstream systems can use before expensive reasoning is necessary. The longer-term motivation includes robotic perception; the first commercial experiment is image-to-3D modeling.

## Working direction

- Use a structured blueprint between perception and geometry construction.
- Apply deterministic, category-specific modeling methods where suitable.
- Keep AI/model APIs interchangeable so improvements in external models can improve perception without replacing the geometry system.
- A Luna model API was discussed as a candidate. No exact provider, model identifier, API contract, or credentials have been supplied or selected.
- Develop through cloud sessions with GitHub holding the code and project history.
- Prefer GitHub Pages for the initial static web interface. API access requirements and computation needs will determine whether a backend is necessary.
- Focus first on quality, speed, per-model cost, and cost at scale. Accounts and billing can wait.

## Open decisions

- First supported object category and representative sample images.
- Meaning of industrial quality for that category, including geometry, dimensions, topology, and export requirements.
- Perception provider and structured blueprint schema.
- What runs locally in the browser and what requires an external service.

## Progress

- 2026-10-03: Repository supplied by the user. Added README, development instructions, project context, and a minimal ignore file for the initial write-access test.
- 2026-10-03: Added a browser-only blueprint-to-3D prototype and a `retina.blueprint/v1` contract for plates with round through-holes. During the initial experiment, image interpretation can be done by a person or assistant; an image-model API is not connected.
- Published to https://dostonsuxrobov.github.io/retina/ with GitHub Actions configured to deploy `site/` after pushes to `main`.
- The page validates JSON, previews deterministic geometry, and exports a GLB with dimensions converted from millimetres to metres. A live browser check confirmed the sample and valid/invalid JSON interactions; the test browser required the SVG preview because WebGL is unavailable there.

## Next step

Use a real reference image to produce a blueprint and test it in the app. Record which dimensions were supplied versus inferred, inspect the GLB in a 3D viewer, then decide whether to refine the plate recipe or support a second object category.

## Shed input fix — 2026-10-03

A shed blueprint was previously provided in an unsupported draft format, causing validation to fail. Added a separate deterministic shed builder and `retina.shed/v1` schema with compatibility for that original draft file. Added actual wall cutouts, door/window assemblies, a gable roof, trim, siding seams, and cupola. Camera framing, Z-up orientation, grid size, and fog now adapt to building dimensions. Added a downloadable shed example.

Validated the original JSON with real Three.js geometry: 223 meshes, finite vertex/bounding values, four wall opening ray checks, and seven malformed-input rejection cases. Verified binary GLB export and millimetre-to-metre root scaling. JavaScript syntax checks passed. Browser automation could not run in this session because the local browser executable was unavailable; visual fidelity and live WebGL interactions remain to be checked.

Next: load the original shed file in the deployed app, inspect its proportions against the photo, then supply one measured dimension to establish scale. This is a coarse architectural recipe, not validated industrial reconstruction.
