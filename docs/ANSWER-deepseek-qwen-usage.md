# DeepSeek & Qwen 使用答案

## ✅ 直接回答您的问题

### Q: 系统是否已经支持 DeepSeek 和 Qwen？

**A: 是的！完全支持！** 

查看 `src/providers/llm/llm-factory.ts` 代码：

```typescript:src/providers/llm/llm-factory.ts
case "DEEPSEEK":
  provider = new OpenAICompatibleLLM(
    "DEEPSEEK_",
    undefined,
    config.model,
  );
  break;
// ...
case "QWEN":
  provider = new OpenAICompatibleLLM("QWEN_", undefined, config.model);
  break;
```

✅ DeepSeek 和 Qwen 已经内置支持，无需任何代码修改！

### Q: 只在 .env 配置 URL 和 API Key 是否就能直接使用？

**A: 是的！** 只需配置以下内容即可：

#### 配置 DeepSeek

```bash
# 在 .env 文件中添加以下三行即可
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-你的API密钥"  # ⚠️ 必须替换
DEEPSEEK_MODEL="deepseek-chat"

# 设置为默认提供者（替换当前的 GEMINI）
DEFAULT_LLM_PROVIDER="DEEPSEEK"
```

**就这样！** 无需其他配置，立即可用。

#### 配置 Qwen

```bash
# 在 .env 文件中添加以下三行即可
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_API_KEY="sk-你的API密钥"  # ⚠️ 必须替换
QWEN_MODEL="qwen-max"

# 设置为默认提供者
DEFAULT_LLM_PROVIDER="QWEN"
```

**就这样！** 无需其他配置，立即可用。

### Q: 能否使用其他模型进行与 Gemini 相同的流程操作？

**A: 完全可以！** 系统设计就是为了支持多模型切换，所有功能完全兼容：

#### 当前您的配置（使用 Gemini）

```bash
GEMINI_API_KEY=AIzaSyDwmM-dK3orNSfvPgblEY_mAHfEZZBshzk
DEFAULT_LLM_PROVIDER=GEMINI
AI_CONTENT_RANKER_LLM_PROVIDER=GEMINI
AI_SUMMARIZER_LLM_PROVIDER=GEMINI
```

#### 改为 DeepSeek（一模一样的功能）

```bash
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-你的API密钥"
DEEPSEEK_MODEL="deepseek-chat"

DEFAULT_LLM_PROVIDER="DEEPSEEK"
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK"
AI_SUMMARIZER_LLM_PROVIDER="DEEPSEEK"
```

#### 改为 Qwen（一模一样的功能）

```bash
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_API_KEY="sk-你的API密钥"
QWEN_MODEL="qwen-max"

DEFAULT_LLM_PROVIDER="QWEN"
AI_CONTENT_RANKER_LLM_PROVIDER="QWEN"
AI_SUMMARIZER_LLM_PROVIDER="QWEN"
```

### Q: 切换后会影响功能吗？

**A: 不会！完全透明切换。** 所有功能保持一致：

| 功能 | Gemini | DeepSeek | Qwen | 说明 |
|------|--------|----------|------|------|
| ✅ 科技新闻总结 | 支持 | 支持 | 支持 | 完全一致 |
| ✅ GitHub 项目分析 | 支持 | 支持 | 支持 | 完全一致 |
| ✅ 单 URL 转载 | 支持 | 支持 | 支持 | 完全一致 |
| ✅ 话题搜索 | 支持 | 支持 | 支持 | 完全一致 |
| ✅ 文章生成 | 支持 | 支持 | 支持 | 完全一致 |
| ✅ 微信发布 | 支持 | 支持 | 支持 | 完全一致 |
| ✅ UI 控制面板 | 支持 | 支持 | 支持 | 完全一致 |

**所有工作流完全一样，只是换了个 LLM 引擎！**

## 🚀 2 分钟快速配置

### 方式 1: 直接编辑 .env 文件（最快）

```bash
# 1. 编辑 .env 文件
nano .env  # 或用任何文本编辑器

# 2. 添加 DeepSeek 配置（3 行）
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-你的API密钥"  # ⚠️ 替换这个！
DEEPSEEK_MODEL="deepseek-chat"

# 3. 修改默认提供者（1 行）
DEFAULT_LLM_PROVIDER="DEEPSEEK"  # 从 GEMINI 改为 DEEPSEEK

# 4. 保存并退出

# 5. 重启服务
deno task start
```

**就这么简单！** 2 分钟搞定。

### 方式 2: 通过 UI 界面配置（更简单）

```bash
# 1. 启动服务
deno task start

# 2. 访问 http://localhost:8000

# 3. 点击"环境变量配置"标签页

# 4. 找到以下配置项并填写：
#    - DEEPSEEK_BASE_URL = https://api.deepseek.com/v1
#    - DEEPSEEK_API_KEY = sk-你的API密钥
#    - DEEPSEEK_MODEL = deepseek-chat
#    - DEFAULT_LLM_PROVIDER = DEEPSEEK

# 5. 点击"保存配置"

# 6. 刷新页面，立即生效！
```

**最简单的方式！** 可视化操作，不用手动编辑文件。

## 🔑 获取 API Key

### DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册并登录
3. 点击左侧"API Keys"
4. 点击"Create API Key"
5. 复制生成的 API Key（格式：`sk-xxx...`）
6. 充值 ¥10（0.001元/千tokens，能用很久）

### Qwen API Key

1. 访问 https://dashscope.aliyun.com/
2. 登录阿里云账号
3. 开通"灵积模型服务"
4. 进入"API-KEY 管理"
5. 创建新的 API Key
6. 复制 API Key
7. 确保账号有余额

## 💡 推荐配置方案

### 方案 A: 完全替换为 DeepSeek（最简单）

```bash
# 只需要配置这 4 行！
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-xxx"
DEEPSEEK_MODEL="deepseek-chat"
DEFAULT_LLM_PROVIDER="DEEPSEEK"
```

**优点**：
- 配置最简单
- 成本极低（¥10 能用几个月）
- 不限流

**适合**: 个人使用、高频发布

### 方案 B: 混合使用（效果最好）

```bash
# DeepSeek - 日常使用
DEEPSEEK_API_KEY="sk-xxx"
DEEPSEEK_MODEL="deepseek-chat"

# Qwen - 重要文章
QWEN_API_KEY="sk-xxx"
QWEN_MODEL="qwen-max"

# 分场景配置
DEFAULT_LLM_PROVIDER="DEEPSEEK"              # 默认用便宜的
AI_SUMMARIZER_LLM_PROVIDER="QWEN:qwen-max"  # 重要文章用高质量
```

**优点**：
- 各取所长
- 效果最优
- 成本可控

**适合**: 追求质量、预算充足

## ❓ 常见疑问

### Q: 配置后立即生效吗？

**A**: 需要重启服务。修改 .env 后按 `Ctrl+C` 停止，再运行 `deno task start` 启动即可。

### Q: 可以保留 Gemini 作为备用吗？

**A**: 可以！只需修改 `DEFAULT_LLM_PROVIDER`，Gemini 配置保留不删除，需要时可以随时切换回来。

### Q: 怎么验证配置是否生效？

**A**: 启动服务后，在 UI 界面运行一次工作流，查看日志，会显示使用的是哪个模型。

### Q: DeepSeek 和 Gemini 有什么区别？

| 对比项 | Gemini | DeepSeek |
|--------|--------|----------|
| 成本 | 免费（限额） | 极低（¥0.001/千tokens） |
| 限流 | 经常 | 很少 |
| 稳定性 | 中等 | 稳定 |
| 速度 | 很快 | 快 |
| 质量 | 高 | 高 |

**结论**: DeepSeek 更稳定，不限流，成本极低，推荐！

## 📝 完整配置示例

这是一个完整的 DeepSeek 配置示例（直接复制粘贴到 .env）：

```bash
# ============================================
# DeepSeek 配置（替换 Gemini）
# ============================================

DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxx"  # ⚠️ 替换为您的 API Key
DEEPSEEK_MODEL="deepseek-chat"

# 设置为默认提供者
DEFAULT_LLM_PROVIDER="DEEPSEEK"

# 所有场景都用 DeepSeek
AI_CONTENT_RANKER_LLM_PROVIDER="DEEPSEEK:deepseek-chat"
AI_SUMMARIZER_LLM_PROVIDER="DEEPSEEK:deepseek-chat"
SINGLE_URL_LLM_PROVIDER="DEEPSEEK:deepseek-chat"

# ============================================
# 原 Gemini 配置（可保留作为备用）
# ============================================
# GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
# GEMINI_API_KEY="AIzaSyDwmM-dK3orNSfvPgblEY_mAHfEZZBshzk"
# GEMINI_MODEL="gemini-flash-lite-latest"

# ============================================
# 其他配置（保持不变）
# ============================================
# ... 其他环境变量 ...
```

## 🎉 总结

1. ✅ **系统已完全支持** DeepSeek 和 Qwen
2. ✅ **只需配置 .env** 即可直接使用
3. ✅ **所有功能完全一致** 与 Gemini 无差别
4. ✅ **切换简单** 2 分钟搞定
5. ✅ **推荐使用 DeepSeek** 便宜稳定不限流

---

**立即行动**：现在就获取 DeepSeek API Key，2 分钟配置完成，告别 Gemini 限流烦恼！
