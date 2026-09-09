# Getting started

[Back to the introduction](../README.md) · [中文介绍](../README.zh-CN.md)

## Choose your first run

| Goal | Command | Requirements |
| --- | --- | --- |
| Understand the interface | `deno task --config demo.json demo` | Deno 2; browser access to the UI's public CDNs |
| Collect and prepare real articles | `deno task start` | Dependencies, `.env`, model + source + WeChat settings |
| Verify the fixture backend | `deno task --config demo.json test` | Deno 2; no external services |

The separate `demo.json` avoids resolving the production dependency graph on a fresh installation. Once project dependencies are installed, `deno task demo` and `deno task test:demo` are convenient aliases.

The demo listens at `http://127.0.0.1:8001`; the live app listens at `http://127.0.0.1:8000`. Both bind to loopback. Stop either server with Ctrl+C.

## Install

1. Install Deno 2 using the [official installation guide](https://docs.deno.com/runtime/getting_started/installation/). Verify with `deno --version`.
2. Clone the repository and open its directory. If GitHub returns 404, check the repository URL and sign in with an account that has access.
3. For the demo, run `deno task --config demo.json demo` immediately. It uses a separate entry point without loading the production backend or `.env`.
4. For a real run, install dependencies and create your configuration:

```bash
deno install --allow-scripts
cp .env.example .env
```

On Windows PowerShell, replace the copy command with:

```powershell
Copy-Item .env.example .env
```

Do not overwrite an existing `.env`. The setup scripts preserve it. macOS/Linux: `bash setup.sh`; Windows: `./setup.ps1` or `setup.bat`. The scripts install Deno if missing, resolve dependencies, and copy the example configuration when needed.

## Configure a real run

Edit `.env` before starting. The example selects DeepSeek for text and Qwen Image Max for covers; all keys are empty. Those are configuration examples, not guarantees of model availability. Choose models enabled for your provider account.

| Setting | Purpose / when needed |
| --- | --- |
| `DEFAULT_LLM_PROVIDER=DEEPSEEK` | Default text provider |
| `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL` | Credentials, API endpoint, and model for that provider |
| `AI_SUMMARIZER_LLM_PROVIDER=DEEPSEEK` | Main article preparation model; also accepts `PROVIDER:model` |
| `AI_PRE_EXTRACT_LLM_PROVIDER=DEEPSEEK` | Pre-extraction model |
| `WEIXIN_APP_ID`, `WEIXIN_APP_SECRET` | Official Account credentials; required by the current live workflow's initial validation |
| `AUTHOR` | Article author label |
| `FIRE_CRAWL_API_KEY`, `FIRE_CRAWL_BASE_URL` | Technology-news collection and Firecrawl-backed URL/search branches |
| `IMAGE_GENERATOR_TYPE=QWEN_IMAGE_MAX` | Cover generator selected by the main workflow |
| `DASHSCOPE_API_KEY`, `DASHSCOPE_REGION=cn` | Qwen image service configuration for the China region; use the appropriate credentials for your account region |
| `DEFAULT_COVER_IMAGE_URL` | Optional accessible cover fallback when generation fails |
| `ENABLE_DB=false` | Keep MySQL optional for the initial run |
| `ENABLE_DEDUPLICATION=false` | Avoid requiring the optional embedding setup at first |
| `ENABLE_BARK=false` | Keep Bark notifications off unless configured |
| `ENABLE_CRON=false` | Keep scheduled execution off during setup |

Gemini covers use `GEMINI` or `GEMINI_PRO` plus the matching Gemini settings. `TEXT_LOGO` exists in the provider factory, but the main workflow's cover-generation branch does not handle it; this is why the example now uses `QWEN_IMAGE_MAX`. A fallback cover must still be suitable for WeChat upload. Missing or placeholder cover IDs are not a reliable publishing configuration.

The configuration center can edit provider and WeChat settings. It persists credentials in `.env`, so use it only on your trusted local machine. Some model names in its menus may be old; edit `.env` when you need a different supported model.

## First real article

1. Ensure the WeChat Official Account can use the required image/material and draft APIs. Configure its IP allowlist for the machine's outgoing IP.
2. Run `deno task start` from the project root. The live app attempts to open the browser automatically; `CI=true` suppresses browser opening.
3. Open `http://127.0.0.1:8000` and select a visible content mode. Start with one article. GitHub Trending already fixes the UI to one project.
4. Click **开始运行任务** and follow the live logs. A successful trigger response means the workflow was accepted, not that an article has finished.
5. Read the preview. Open **再改改**, edit Markdown or use AI refinement, and click **保存修改**.
6. Click **上传至微信草稿箱** only when ready. Review the resulting draft in the WeChat Official Account backend, then send it there.

`previewOnly=true` skips the final draft-creation step; it does **not** make the production workflow side-effect-free. The workflow currently validates WeChat access and may upload a generated cover before returning the preview. Use `deno task --config demo.json demo` for an experience with no provider or publishing calls.

## Content modes and API

The UI sends JSON-RPC to `POST /api/workflow`; logs stream from `GET /api/logs`.

| `contentMode` | Input | UI status |
| --- | --- | --- |
| `TECH_NEWS` | Source list in `src/data-sources/getDataSources.ts` | Visible |
| `GITHUB_TRENDING` | GitHub Trending and README retrieval | Visible |
| `AI_NEWS_SITE` | Direct AI news-site scraper | Backend branch; no visible selector |
| `SINGLE_URL` | `url` parameter | Controls commented out |
| `TOPIC_SEARCH` | `topic` parameter | Controls commented out |

For a configured live server, this is a one-project preview request. It can make paid provider calls and perform the WeChat validation/cover upload described above:

```bash
curl http://127.0.0.1:8000/api/workflow \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"triggerWorkflow","params":{"workflowType":"weixin-article-workflow","contentMode":"GITHUB_TRENDING","maxArticles":1,"template":"default","previewOnly":true}}'
```

Do not expose the live server directly on a public interface. Its configuration and file-serving routes were designed for local use; the hostname-based authentication check is not a hardened remote access boundary.

## Scheduling

Scheduling is **off by default**, including for existing `.env` files that omit `ENABLE_CRON`. Set `ENABLE_CRON=true` and restart only after a manual run works.

The current schedule is `0 3 * * *` in `Asia/Shanghai`. `WorkflowConfigService` reads the daily keys `1_of_week_workflow` through `7_of_week_workflow` and falls back to the WeChat workflow. The cron path supplies an empty payload and can create a draft without a UI confirmation. Source selection falls back to `CONTENT_MODE` (the example uses `AI_NEWS_SITE`). Keep the process running for scheduling to work. There is no scheduling editor in the UI.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `.env.template` missing | The checked-in file is `.env.example`; use the commands above |
| Port already in use | Stop the existing process; demo and live ports are 8001 and 8000 |
| Plain or broken-looking page | Allow the Tailwind, Font Awesome, Mermaid, and font CDNs used by `public/index.html` |
| Real run fails before scraping | Check WeChat credentials, API access, and outgoing-IP allowlist |
| Provider error / model not found | Verify provider prefix, endpoint, key, model, and account region |
| Cover generation or upload fails | Check image-provider credentials or a valid `DEFAULT_COVER_IMAGE_URL` |
| No new articles | Inspect source availability and local deduplication registries |
| Preview disappeared after restart | The current preview is a process-memory singleton; inspect local saved article output separately |
| `deno check src/index.ts` fails | See the existing errors documented in [VERIFICATION.md](VERIFICATION.md); the isolated demo has its own passing checks |

## Local files

Generated articles, scraped data, images, and registries live under `data/` through the storage utilities. `.env`, `data/`, dependency folders, and submission artifacts are ignored for new commits. Git ignore rules do not untrack files already committed to a remote repository; review the tracked file list before publishing changes.
