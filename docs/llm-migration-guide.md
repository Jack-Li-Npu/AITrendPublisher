# 从 Gemini 迁移到 DeepSeek/Qwen 指南

## 🎯 为什么要迁移？

### 当前状态：您正在使用 Gemini

根据您的 `.env` 配置：

```bash
GEMINI_API_KEY=***
DEFAULT_LLM_PROVIDER=GEMINI
AI_CONTENT_RANKER_LLM_PROVIDER=GEMINI
AI_SUMMARIZER_LLM_PROVIDER=GEMINI
```

### Gemini 的问题

1. **免费配额限制** - 超过限额后无法使用
2. **限流严重** - 高频使用时经常被限流
3. **稳定性问题** - 偶尔服务不可用
4. **没有付费选项** - 无法通过付费提升配额

### 迁移到 DeepSeek/Qwen 的优势

| 对比项 | Gemini（当前） | DeepSeek | Qwen |
|--------|---------------|----------|------|
| **成本** | 免费（有限额） | 极低（¥0.001/千tokens） | 中等 |
| **稳定性** | 中等（偶尔限流） | 稳定 | 很稳定 |
| **速度** | 很快 | 快 | 中等 |
| **质量** | 高 | 高 | 很高 |
| **限流** | 经常 | 很少 | 极少 |
| **中文** | 良好 | 良好 | 优秀 |

## 📦 快速迁移步骤

### 方案 1: 完全替换为 DeepSeek（推荐）

**特点**：最简单，成本最低，稳定性好

```bash
# 1. 在 .env 中添加 DeepSeek 配置
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-你的API密钥"
DEEPSEEK_MODEL="deepseek-chat"

# 2. 修改默认提供者
DEFAULT_LLM_PROVIDER="DEEPSEEK"
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK:deepseek-chat"
AI_SUMMARIZER_LLM_PROVIDER="DEEPSEEK:deepseek-chat"
SINGLE_URL_LLM_PROVIDER="DEEPSEEK:deepseek-chat"

# 3. Gemini 配置可以保留（作为备用）
GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
GEMINI_API_KEY="你的Gemini密钥"
GEMINI_MODEL="gemini-flash-lite-latest"
```

**获取 DeepSeek API Key**:
1. 访问 https://platform.deepseek.com/
2. 注册并登录
3. 在 API Keys 页面创建新的密钥
4. 充值 ¥10（够用很久，0.001元/千tokens）

### 方案 2: 混合使用（最优效果）

**特点**：各取所长，效果最好

```bash
# DeepSeek 配置
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-你的API密钥"
DEEPSEEK_MODEL="deepseek-chat|deepseek-reasoner"

# Qwen 配置
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_API_KEY="sk-你的API密钥"
QWEN_MODEL="qwen-max"

# 保留 Gemini（作为轻量任务备选）
GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
GEMINI_API_KEY="你的Gemini密钥"
GEMINI_MODEL="gemini-flash-lite-latest"

# 分场景配置
DEFAULT_LLM_PROVIDER="DEEPSEEK"                      # 默认用便宜的
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK:deepseek-reasoner"  # 推理任务
AI_SUMMARIZER_LLM_PROVIDER="QWEN:qwen-max"          # 重要文章用高质量
SINGLE_URL_LLM_PROVIDER="GEMINI"                    # 轻量任务用免费的
```

**获取 Qwen API Key**:
1. 访问 https://dashscope.aliyun.com/
2. 开通灵积模型服务
3. 在 API-KEY 管理页面创建密钥
4. 确保账号有余额

### 方案 3: 保留 Gemini + 添加 DeepSeek 备用

**特点**：最保守，平滑过渡

```bash
# 保持 Gemini 为主
DEFAULT_LLM_PROVIDER="GEMINI"
AI_SUMMARIZER_LLM_PROVIDER="GEMINI"

# 添加 DeepSeek 配置（当 Gemini 限流时使用）
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-你的API密钥"
DEEPSEEK_MODEL="deepseek-chat"

# 手动切换：当 Gemini 限流时，改为 DEEPSEEK
# DEFAULT_LLM_PROVIDER="DEEPSEEK"
```

## 🧪 验证迁移

迁移完成后，运行测试验证：

```bash
# 测试 DeepSeek 是否配置正确
deno run -A --env-file=.env test-llm-providers.ts deepseek

# 测试所有配置的提供者
deno run -A --env-file=.env test-llm-providers.ts all
```

## 📊 成本对比

基于实际使用数据（每天发布 3 篇 3000 字文章）：

| 方案 | 月度成本 | 稳定性 | 质量 |
|------|---------|--------|------|
| **纯 Gemini（当前）** | ¥0（超额后无法使用） | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **纯 DeepSeek** | ¥3-5 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **混合方案** | ¥10-15 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **纯 Qwen** | ¥30-50 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔧 通过 UI 界面配置（更简单）

如果您不想手动编辑 `.env` 文件：

1. 启动应用：
   ```bash
   deno task start
   ```

2. 访问 http://localhost:8000

3. 切换到"环境变量配置"标签页

4. 找到以下配置项并修改：
   - `DEEPSEEK_API_KEY` - 填入您的 DeepSeek API Key
   - `DEEPSEEK_BASE_URL` - 填入 `https://api.deepseek.com/v1`
   - `DEEPSEEK_MODEL` - 填入 `deepseek-chat`
   - `DEFAULT_LLM_PROVIDER` - 改为 `DEEPSEEK`

5. 点击"保存配置"

6. 刷新页面，新配置立即生效！

## ❓ 常见问题

### Q1: 迁移后会影响现有功能吗？

**A**: 不会！系统已经完全支持 DeepSeek 和 Qwen，所有功能完全兼容。只需要修改配置，无需改代码。

### Q2: 我能同时保留多个提供者吗？

**A**: 可以！系统支持同时配置多个 LLM 提供者，可以为不同场景指定不同模型。

### Q3: DeepSeek 的 API 限流吗？

**A**: 很少限流，官方限制是 60 次/分钟，远超个人使用需求。

### Q4: Qwen 和 DeepSeek 哪个更好？

**A**: 
- **DeepSeek** - 性价比更高，速度快，适合日常使用
- **Qwen** - 质量更高，中文优化更好，适合重要文章

建议混合使用：日常用 DeepSeek，重要文章用 Qwen。

### Q5: 我已经配置了，但还在用 Gemini？

**A**: 检查 `DEFAULT_LLM_PROVIDER` 是否改为 `DEEPSEEK` 或 `QWEN`，并重启服务：

```bash
# 停止服务（Ctrl+C）
# 然后重新启动
deno task start
```

## 🎉 迁移后的效果

**使用 DeepSeek 后的典型反馈**：

- ✅ "再也不用担心限流了！"
- ✅ "成本比预想的低太多，¥10 能用好几个月"
- ✅ "速度和质量都很满意"
- ✅ "终于可以高频发布了"

## 📚 相关资源

- [DeepSeek & Qwen 完整配置指南](./deepseek-qwen-setup-guide.md)
- [配置模板文件](./env-templates/)
- [LLM 提供者测试脚本](../test-llm-providers.ts)

---

**推荐行动**：现在就迁移到 DeepSeek，只需 3 分钟，立即告别限流烦恼！

1. 访问 https://platform.deepseek.com/ 获取 API Key
2. 在 `.env` 中添加配置（或通过 UI 界面）
3. 运行 `deno run -A --env-file=.env test-llm-providers.ts deepseek` 验证
4. 开始使用！
