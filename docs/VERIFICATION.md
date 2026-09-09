# Verification notes

**English** | [简体中文](VERIFICATION.zh-CN.md) · [All guides](README.md) · [Project introduction](../README.md)

Verified on 2026-09-09 with Deno 2.6.4, V8 14.2, and TypeScript 5.9.2 on macOS ARM64.

## Passing checks

```bash
deno task --config demo.json test
deno check --no-config scripts/demo.ts scripts/demo_test.ts
deno lint scripts/demo.ts scripts/demo_test.ts
deno fmt --check scripts/demo.ts scripts/demo_test.ts
```

The isolated demo tests also pass with a fresh `DENO_DIR`, without downloading production dependencies.

The two demo tests cover initial empty state, mode-specific sample selection, in-memory Markdown updates, blocked AI/configuration/publishing operations, HTML escaping, rejection of cross-origin requests, and refusal to serve `.env`, article data, or source files. Tests use the handler directly and need no network or filesystem permissions.

Browser verification uses the real control panel served by `deno task --config demo.json demo`: sample preview, opening the Markdown editor, editing text, and saving the updated article preview, reopening the editor with the saved text retained, and confirming that attempted WeChat upload shows a demo-only refusal. Screenshots use hand-authored samples and the demo renderer.

Documentation SVGs parse successfully, and relative documentation links and image paths are checked before submission. `scripts/generate-doc-assets.py` regenerates the documentation illustrations.

## Main application baseline

`deno check src/index.ts` reported **70 errors before changes and 70 errors afterward**. This introduction/demo work does not claim the full application passes type checking.

Examples of existing issues:

- `refineContent` handles `sectionType: "full"` and `currentContent` even though its declared input type omits them.
- Several catch blocks access `.message` on an `unknown` value.
- Buffer/Blob typing incompatibilities occur in image-processing paths.
- Additional renderer/provider/workflow typing issues remain in the production module graph.

These errors require a separate production-code cleanup with suitable integration fixtures. They do not prevent the isolated demo from type checking and running.

## Bilingual documentation checks

English and Chinese guides offer a language switch to the same topic. Checks cover documentation links, heading anchors, image paths, Chinese SVG parsing, and matching key commands/configuration names across languages. App controls retain their actual Chinese labels with explanations for English readers. This documentation update does not change production application code; the 70-error count above is the previously recorded baseline.

## Not verified here

- Paid LLM/image-provider calls, live website scraping, WeChat token validation, image upload, or draft creation.
- MySQL integration, embedding/reranking services, daily scheduled execution, or Windows/Linux setup scripts.
- A multi-user or public-hosted deployment. The live server is loopback-only by default.

The demo does not read the user's existing `.env` or article data. No real WeChat article was sent or uploaded during the demonstration.
