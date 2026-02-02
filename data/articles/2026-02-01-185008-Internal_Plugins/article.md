# Internal Plugins

探索 ``anthropics/claude-plugins-official``，解锁 Claude AI 的无限潜力。

---

## anthropics/claude-plugins-official (⭐ 6.0k)

# Claude Code Plugins Directory

A curated directory of high-quality plugins for Claude Code.

> **⚠️ Important:** Make sure you trust a plugin before installing, updating, or using it. Anthropic does not control what MCP servers, files, or other software are included in plugins and cannot verify that they will work as intended or that they won't change. See each plugin's homepage for more information.

## Structure

- **`/plugins`** - Internal plugins developed and maintained by Anthropic
- **`/external_plugins`** - Third-party plugins from partners and the community

## Installation

Plugins can be installed directly from this marketplace via Claude Code's plugin system.

To install, run `/plugin install {plugin-name}@claude-plugin-directory`

or browse for the plugin in `/plugin > Discover`

## Contributing

### Internal Plugins

Internal plugins are developed by Anthropic team members. See `/plugins/example-plugin` for a reference implementation.

### External Plugins

Third-party partners can submit plugins for inclusion in the marketplace. External plugins must meet quality and security standards for approval. To submit a new plugin, use the [plugin directory submission form](https://clau.de/plugin-directory-submission).

## Plugin Structure

Each plugin follows a standard structure:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json      # Plugin metadata (required)
├── .mcp.json            # MCP server configuration (optional)
├── commands/            # Slash commands (optional)
├── agents/              # Agent definitions (optional)
├── skills/              # Skill definitions (optional)
└── README.md            # Documentation
```

## Documentation

For more information on developing Claude Code plugins, see the [official documentation](https://code.claude.com/docs/en/plugins).



---



## 结语

感谢阅读今日的 AI 速递！我们持续关注人工智能领域的最新动态，为您带来最前沿的技术资讯。

💬 你用过哪些 AI 工具？欢迎评论区分享你的体验！
⭐ 觉得有用？点个「在看」让更多开发者看到这篇内容！

<center>
    <img src="https://fastly.jsdelivr.net/gh/bucketio/img18@main/2026/01/06/1767672738369-47fc1fed-2c8b-49d2-ae30-f8a45edc41bb.png" style="width: 100px;">
</center>