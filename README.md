# Retina

Fast visual reconstruction through structured perception and deterministic geometry.

Repository: https://github.com/dostonsuxrobov/retina

## Direction

Retina aims to turn visual input into a structured representation that geometry builders, and eventually reasoning and action systems, can use.

The first product goal is image-to-3D reconstruction: upload an image and produce a useful, high-quality model quickly and affordably. Industrial-quality output is a target to validate, not an achieved capability.

Proposed pipeline:

1. Interpret the image with a replaceable perception/model adapter.
2. Produce a structured blueprint with explicit assumptions and uncertainty.
3. Validate the blueprint.
4. Build geometry deterministically using a workflow appropriate to the object category.
5. Inspect quality and export the result.

A single image does not reveal hidden surfaces or physical dimensions; the system must distinguish observations from inferred details.

## Prototype

The browser prototype is in [`site/`](site/). It accepts a `retina.blueprint/v1` JSON file, validates and builds a parametric mounting plate with through-holes, previews it in 3D, and exports GLB. It uses WebGL where available and falls back to an SVG preview where it is not. The browser app does not call an image model yet; during this experiment, a person can provide the image here and use a generated blueprint as its input. A second recipe builds gable-roof sheds with doors, windows, siding, trim, and cupola from `retina.shed/v1` JSON; it also accepts the original `retina.shed/proposed-v1` file. Photo-derived dimensions remain estimates. See [the blueprint contract](docs/BLUEPRINT.md).

The prototype is served from GitHub Pages through the Actions workflow in `.github/workflows/pages.yml`. Three.js and its controls/exporter are loaded from jsDelivr at runtime.

The initial questions are:

- Can someone create a model meeting a defined quality standard from an uploaded image quickly and cheaply?
- Can the service remain cheap to operate at scale?

See [project context](docs/PROJECT.md) for decisions and next steps, and [AGENTS.md](AGENTS.md) for development instructions.
