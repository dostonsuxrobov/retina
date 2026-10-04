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
- No application or reconstruction pipeline has been implemented yet.

## Next step

Choose one narrow object category and a sample image, define a measurable quality target, then build a small end-to-end reconstruction experiment and measure quality, latency, and cost.
