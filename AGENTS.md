# Development instructions

## Start here

- Read `README.md` and `docs/PROJECT.md` before making changes.
- Treat this repository as the source of truth for code, decisions, and progress.
- Inspect existing files and Git history before assuming the project is empty or repeating work.

## Principles

- Keep implementations simple, modular, and inspectable.
- Use model inference for perception where needed; use deterministic code for validation and geometry construction where practical.
- Keep the perception/model provider replaceable through a clear adapter boundary.
- Distinguish observed features from inferred geometry. Do not imply that hidden dimensions are known from one image.
- Choose workflows by object category rather than claiming universal reconstruction quality.
- Prefer a browser-first prototype. GitHub Pages is the intended initial hosting option; evaluate backend needs only when required by a concrete capability.
- Never commit API keys or credentials, and never embed a shared secret in a public frontend.
- Defer accounts, billing, and unrelated infrastructure during initial feasibility work.
- Favor a restrained interface consistent with shadcn/ui styling when interface work begins.

## Working process

- Make focused changes and run checks appropriate to those changes.
- Record meaningful decisions, validated results, and the next unfinished step in `docs/PROJECT.md`.
- Keep goals separate from measured capabilities. Report quality, latency, and cost only with supporting evidence.
- Do not force-push or overwrite existing work without explicit authorization.
