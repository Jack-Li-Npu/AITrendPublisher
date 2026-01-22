- [README](https://github.com/microsoft/agent-lightning#)
- [Code of conduct](https://github.com/microsoft/agent-lightning#)
- [MIT license](https://github.com/microsoft/agent-lightning#)
- [Security](https://github.com/microsoft/agent-lightning#)

[![Agent-lightning-banner](https://github.com/microsoft/agent-lightning/raw/main/docs/assets/readme-banner.svg)](https://github.com/microsoft/agent-lightning/blob/main/docs/assets/readme-banner.svg)

# Agent Lightning⚡

[Permalink: Agent Lightning⚡](https://github.com/microsoft/agent-lightning#agent-lightning)

[![Unit Tests](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml)[![Documentation](https://camo.githubusercontent.com/fdd579453d6bec9bc192bdc482196edaa66d5cb029f92a2c48a4aa922467d0f6/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f47697448756225323050616765732d446f63756d656e746174696f6e2d626c7565)](https://microsoft.github.io/agent-lightning/)[![PyPI version](https://camo.githubusercontent.com/580ded366a83d7e78a7eeb7e3ff17d381e024565edc396f5e1956b09c63e1e2d/68747470733a2f2f62616467652e667572792e696f2f70792f6167656e746c696768746e696e672e737667)](https://badge.fury.io/py/agentlightning)[![License](https://camo.githubusercontent.com/7013272bd27ece47364536a221edb554cd69683b68a46fc0ee96881174c4214c/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6c6963656e73652d4d49542d626c75652e737667)](https://github.com/microsoft/agent-lightning/blob/main/LICENSE)[![Ask DeepWiki](https://camo.githubusercontent.com/0f5ae213ac378635adeb5d7f13cef055ad2f7d9a47b36de7b1c67dbe09f609ca/68747470733a2f2f6465657077696b692e636f6d2f62616467652e737667)](https://deepwiki.com/microsoft/agent-lightning)[![Discord](https://camo.githubusercontent.com/397741123d69503a0a224452a3629154669e9a870686f0c21c68527c7d8faa07/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f446973636f72642d4a6f696e2d3538363546323f6c6f676f3d646973636f7264266c6f676f436f6c6f723d7768697465)](https://discord.gg/RYk7CdvDR7)

**The absolute trainer to light up AI agents.**

Join our [Discord community](https://discord.gg/RYk7CdvDR7) to connect with other users and contributors.

## ⚡ Core Features

[Permalink: ⚡ Core Features](https://github.com/microsoft/agent-lightning#-core-features)

- Turn your agent into an optimizable beast with **ZERO CODE CHANGE** (almost)! 💤
- Build with **ANY** agent framework (LangChain, OpenAI Agent SDK, AutoGen, CrewAI, Microsoft Agent Framework...); or even WITHOUT agent framework (Python OpenAI). You name it! 🤖
- **Selectively** optimize one or more agents in a multi-agent system. 🎯
- Embraces **Algorithms** like Reinforcement Learning, Automatic Prompt Optimization, Supervised Fine-tuning and more. 🤗

Read more on our [documentation website](https://microsoft.github.io/agent-lightning/).

[![Agent-Lightning Core Quickstart](https://github.com/microsoft/agent-lightning/raw/main/docs/assets/readme-diff.svg)](https://github.com/microsoft/agent-lightning/blob/main/docs/assets/readme-diff.svg)

## ⚡ Installation

[Permalink: ⚡ Installation](https://github.com/microsoft/agent-lightning#-installation)

```
pip install agentlightning
```

For the latest nightly build (cutting-edge features), you can install from Test PyPI:

```
pip install --upgrade --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ --pre agentlightning
```

Please refer to our [installation guide](https://microsoft.github.io/agent-lightning/stable/tutorials/installation/) for more details.

To start using Agent-lightning, check out our [documentation](https://microsoft.github.io/agent-lightning/) and [examples](https://github.com/microsoft/agent-lightning/blob/main/examples).

## ⚡ Articles

[Permalink: ⚡ Articles](https://github.com/microsoft/agent-lightning#-articles)

- 12/17/2025 [Adopting the Trajectory Level Aggregation for Faster Training](https://agent-lightning.github.io/posts/trajectory_level_aggregation/) Agent-lightning blog.
- 11/4/2025 [Tuning ANY AI agent with Tinker ✕ Agent-lightning](https://medium.com/@yugez/tuning-any-ai-agent-with-tinker-agent-lightning-part-1-1d8c9a397f0e) Medium. See also [Part 2](https://medium.com/@yugez/tuning-any-ai-agent-with-tinker-agent-lightning-part-2-332c5437f0dc).
- 10/22/2025 [No More Retokenization Drift: Returning Token IDs via the OpenAI Compatible API Matters in Agent RL](https://blog.vllm.ai/2025/10/22/agent-lightning.html) vLLM blog. See also [Zhihu writeup](https://zhuanlan.zhihu.com/p/1965067274642785725).
- 8/11/2025 [Training AI Agents to Write and Self-correct SQL with Reinforcement Learning](https://medium.com/@yugez/training-ai-agents-to-write-and-self-correct-sql-with-reinforcement-learning-571ed31281ad) Medium.
- 8/5/2025 [Agent Lightning: Train ANY AI Agents with Reinforcement Learning](https://arxiv.org/abs/2508.03680) arXiv paper.
- 7/26/2025 [We discovered an approach to train any AI agent with RL, with (almost) zero code changes.](https://www.reddit.com/r/LocalLLaMA/comments/1m9m670/we_discovered_an_approach_to_train_any_ai_agent/) Reddit.
- 6/6/2025 [Agent Lightning - Microsoft Research](https://www.microsoft.com/en-us/research/project/agent-lightning/) Project page.

## ⚡ Community Projects

[Permalink: ⚡ Community Projects](https://github.com/microsoft/agent-lightning#-community-projects)

- [DeepWerewolf](https://github.com/af-74413592/DeepWerewolf) — A case study of agent RL training for the Chinese Werewolf game built with AgentScope and Agent Lightning.
- [AgentFlow](https://agentflow.stanford.edu/) — A modular multi-agent framework that combines planner, executor, verifier, and generator agents with the Flow-GRPO algorithm to tackle long-horizon, sparse-reward tasks.
- [Youtu-Agent](https://github.com/TencentCloudADP/Youtu-agent) — Youtu-Agent lets you build and train your agent with ease. Built with [a modified branch](https://github.com/microsoft/agent-lightning/tree/contrib/youtu-agent-lightning) of Agent Lightning, Youtu-Agent has verified up to 128 GPUs RL training on maths/code and search capabilities with steady convergence. Also check [the recipe](https://github.com/TencentCloudADP/youtu-agent/tree/rl/agl) and their blog [_Stop Wrestling with Your Agent RL: How Youtu-Agent Achieved Stable, 128-GPU Scaling Without Breaking a Sweat_](https://spotted-coconut-df8.notion.site/Stop-Wrestling-with-Your-Agent-RL-How-Youtu-Agent-Achieved-Stable-128-GPU-Scaling-Without-Breaking-2ca5e8f089ba80539a98c582b65e0233).

## ⚡ Architecture

[Permalink: ⚡ Architecture](https://github.com/microsoft/agent-lightning#-architecture)

Agent Lightning keeps the moving parts to a minimum so you can focus on your idea, not the plumbing. Your agent continues to run as usual; you can still use any agent framework you like; you drop in the lightweight `agl.emit_xxx()` helper, or let the tracer collect every prompt, tool call, and reward. Those events become structured spans that flow into the LightningStore, a central hub that keeps tasks, resources, and traces in sync.

On the other side of the store sits the algorithm you choose, or write yourself. The algorithm reads spans, learns from them, and posts updated resources such as refined prompt templates or new policy weights. The Trainer ties it all together: it streams datasets to runners, ferries resources between the store and the algorithm, and updates the inference engine when improvements land. You can either stop there, or simply let the same loop keep turning.

No rewrites, no lock-in, just a clear path from first rollout to steady improvement.

[![Agent-lightning Architecture](https://github.com/microsoft/agent-lightning/raw/main/docs/assets/readme-architecture.svg)](https://github.com/microsoft/agent-lightning/blob/main/docs/assets/readme-architecture.svg)

## ⚡ CI Status

[Permalink: ⚡ CI Status](https://github.com/microsoft/agent-lightning#-ci-status)

| Workflow | Status |
| --- | --- |
| CPU Tests | [![tests workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/tests.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/tests.yml) |
| Full Tests | [![tests summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-unit.yml) |
| UI Tests | [![UI Tests](https://github.com/microsoft/agent-lightning/actions/workflows/dashboard.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/dashboard.yml) |
| Examples Integration | [![examples summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-examples.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-examples.yml) |
| Latest Dependency Compatibility | [![latest summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-latest.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-latest.yml) |
| Legacy Examples Compatibility | [![compat summary workflow status](https://github.com/microsoft/agent-lightning/actions/workflows/badge-compat.yml/badge.svg)](https://github.com/microsoft/agent-lightning/actions/workflows/badge-compat.yml) |

## ⚡ Citation

[Permalink: ⚡ Citation](https://github.com/microsoft/agent-lightning#-citation)

If you find Agent Lightning useful in your research or projects, please cite our paper:

```
@misc{luo2025agentlightningtrainai,
      title={Agent Lightning: Train ANY AI Agents with Reinforcement Learning},
      author={Xufang Luo and Yuge Zhang and Zhiyuan He and Zilong Wang and Siyun Zhao and Dongsheng Li and Luna K. Qiu and Yuqing Yang},
      year={2025},
      eprint={2508.03680},
      archivePrefix={arXiv},
      primaryClass={cs.AI},
      url={https://arxiv.org/abs/2508.03680},
}
```

## ⚡ Contributing

[Permalink: ⚡ Contributing](https://github.com/microsoft/agent-lightning#-contributing)

This project welcomes contributions and suggestions. Start by reading the [Contributing Guide](https://github.com/microsoft/agent-lightning/blob/main/docs/community/contributing.md) for recommended contribution points, environment setup, branching conventions, and pull request expectations. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit [https://cla.opensource.microsoft.com](https://cla.opensource.microsoft.com/).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## ⚡ Trademarks

[Permalink: ⚡ Trademarks](https://github.com/microsoft/agent-lightning#-trademarks)

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party's policies.

## ⚡ Responsible AI

[Permalink: ⚡ Responsible AI](https://github.com/microsoft/agent-lightning#-responsible-ai)

This project has been evaluated and certified to comply with the Microsoft Responsible AI Standard. The team will continue to monitor and maintain the repository, addressing any severe issues, including potential harms, if they arise.

## ⚡ License

[Permalink: ⚡ License](https://github.com/microsoft/agent-lightning#-license)

This project is licensed under the MIT License. See the [LICENSE](https://github.com/microsoft/agent-lightning/blob/main/LICENSE) file for details.

## About

The absolute trainer to light up AI agents.


[microsoft.github.io/agent-lightning/](https://microsoft.github.io/agent-lightning/ "https://microsoft.github.io/agent-lightning/")

### Topics

[agent](https://github.com/topics/agent "Topic: agent") [reinforcement-learning](https://github.com/topics/reinforcement-learning "Topic: reinforcement-learning") [mlops](https://github.com/topics/mlops "Topic: mlops") [llm](https://github.com/topics/llm "Topic: llm") [agentic-ai](https://github.com/topics/agentic-ai "Topic: agentic-ai")

### Resources

[Readme](https://github.com/microsoft/agent-lightning#readme-ov-file)

### License

[MIT license](https://github.com/microsoft/agent-lightning#MIT-1-ov-file)

### Code of conduct

[Code of conduct](https://github.com/microsoft/agent-lightning#coc-ov-file)

### Security policy

[Security policy](https://github.com/microsoft/agent-lightning#security-ov-file)

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/microsoft/agent-lightning).

[Activity](https://github.com/microsoft/agent-lightning/activity)

[Custom properties](https://github.com/microsoft/agent-lightning/custom-properties)

### Stars

[**10.8k**\\
stars](https://github.com/microsoft/agent-lightning/stargazers)

### Watchers

[**52**\\
watching](https://github.com/microsoft/agent-lightning/watchers)

### Forks

[**890**\\
forks](https://github.com/microsoft/agent-lightning/forks)

[Report repository](https://github.com/contact/report-content?content_url=https%3A%2F%2Fgithub.com%2Fmicrosoft%2Fagent-lightning&report=microsoft+%28user%29)

## [Releases\  7](https://github.com/microsoft/agent-lightning/releases)

[Agent Lightning v0.3.0\\
Latest\\
\\
last monthDec 24, 2025](https://github.com/microsoft/agent-lightning/releases/tag/v0.3.0)

[\+ 6 releases](https://github.com/microsoft/agent-lightning/releases)

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/microsoft/agent-lightning).

## [Contributors\  27](https://github.com/microsoft/agent-lightning/graphs/contributors)

- [![@actions-user](https://avatars.githubusercontent.com/u/65916846?s=64&v=4)](https://github.com/actions-user)
- [![@ultmaster](https://avatars.githubusercontent.com/u/8463288?s=64&v=4)](https://github.com/ultmaster)
- [![@acured](https://avatars.githubusercontent.com/u/10276763?s=64&v=4)](https://github.com/acured)
- [![@wizardlancet](https://avatars.githubusercontent.com/u/5806609?s=64&v=4)](https://github.com/wizardlancet)
- [![@Copilot](https://avatars.githubusercontent.com/in/946600?s=64&v=4)](https://github.com/apps/copilot-pull-request-reviewer)
- [![@hzy46](https://avatars.githubusercontent.com/u/7499023?s=64&v=4)](https://github.com/hzy46)
- [![@JiahangXu](https://avatars.githubusercontent.com/u/24963739?s=64&v=4)](https://github.com/JiahangXu)
- [![@zxgx](https://avatars.githubusercontent.com/u/34452939?s=64&v=4)](https://github.com/zxgx)
- [![@SiyunZhao](https://avatars.githubusercontent.com/u/49901104?s=64&v=4)](https://github.com/SiyunZhao)
- [![@claude](https://avatars.githubusercontent.com/u/81847?s=64&v=4)](https://github.com/claude)
- [![@scott-vsi](https://avatars.githubusercontent.com/u/5100631?s=64&v=4)](https://github.com/scott-vsi)
- [![@TerryChan](https://avatars.githubusercontent.com/u/5396286?s=64&v=4)](https://github.com/TerryChan)
- [![@lspinheiro](https://avatars.githubusercontent.com/u/6465613?s=64&v=4)](https://github.com/lspinheiro)
- [![@lunaqiu](https://avatars.githubusercontent.com/u/19543144?s=64&v=4)](https://github.com/lunaqiu)

[\+ 13 contributors](https://github.com/microsoft/agent-lightning/graphs/contributors)

## Languages

- [Python82.8%](https://github.com/microsoft/agent-lightning/search?l=python)
- [TypeScript15.1%](https://github.com/microsoft/agent-lightning/search?l=typescript)
- [JavaScript0.9%](https://github.com/microsoft/agent-lightning/search?l=javascript)
- [CSS0.8%](https://github.com/microsoft/agent-lightning/search?l=css)
- [Shell0.4%](https://github.com/microsoft/agent-lightning/search?l=shell)
- [HTML0.0%](https://github.com/microsoft/agent-lightning/search?l=html)

## Footer

[GitHub Homepage](https://github.com/)
© 2026 GitHub, Inc.


### Footer navigation

- [Terms](https://docs.github.com/site-policy/github-terms/github-terms-of-service)
- [Privacy](https://docs.github.com/site-policy/privacy-policies/github-privacy-statement)
- [Security](https://github.com/security)
- [Status](https://www.githubstatus.com/)
- [Community](https://github.community/)
- [Docs](https://docs.github.com/)
- [Contact](https://support.github.com/?tags=dotcom-footer)
- Manage cookies

- Do not share my personal information


You can’t perform that action at this time.