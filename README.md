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

## Current status

Project foundation only. No reconstruction engine, model API integration, or deployed web app exists yet.

The initial questions are:

- Can someone create a model meeting a defined quality standard from an uploaded image quickly and cheaply?
- Can the service remain cheap to operate at scale?

See [project context](docs/PROJECT.md) for decisions and next steps, and [AGENTS.md](AGENTS.md) for development instructions.
