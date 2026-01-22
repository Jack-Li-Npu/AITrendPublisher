# DoocsMd 渲染器快速测试指南

## 🚀 3 分钟快速测试

### 方式 1：运行单元测试（推荐）

```bash
# 进入项目目录
cd /Users/jackli/Documents/Cursor_Project/ai-trend-publish

# 运行测试
deno run -A --env-file=.env src/test/doocs-md-renderer.test.ts
```

**预期输出：**

```
============================================================
DoocsMd 渲染器测试
============================================================

[测试 1] 使用默认配置渲染
✅ 成功渲染，HTML 长度：XXX 字符
HTML 预览（前 500 字符）：
<style>...

[测试 2] 使用自定义配置（grace 主题）
✅ 成功渲染，HTML 长度：XXX 字符

[测试 3] 使用快速渲染方法
✅ 成功渲染，HTML 长度：XXX 字符

[保存] 将渲染结果保存到文件
✅ 已保存到 test-doocs-md-output.html

============================================================
所有测试通过 ✅
============================================================
```

### 方式 2：集成到完整工作流

```bash
# 1. 确保 .env 中启用了 DoocsMd 渲染器
echo "USE_DOOCS_MD_RENDERER=true" >> .env

# 2. 运行完整的微信文章发布流程
deno task test
```

**观察日志：**

应该看到类似这样的输出：

```
[渲染] 使用 DoocsMd 渲染器
[DoocsMdRenderer] 开始渲染 X 篇文章
[DoocsMdRenderer] 生成 Markdown，长度：XXX 字符
[DoocsMdRenderer] 渲染完成，HTML 长度：XXX
[DoocsMdRenderer] 图片处理完成
```

## 🔍 查看渲染结果

### 在浏览器中预览

```bash
# 打开生成的 HTML 文件
open test-doocs-md-output.html
```

### 检查要点

✅ **标题样式**
- 一级标题：居中，带下划线
- 二级标题：带背景色
- 三级标题：带左边框

✅ **内容排版**
- 段落间距合理
- 字体大小清晰
- 颜色对比度好

✅ **引用块**
- 左侧有彩色边框
- 背景色柔和

✅ **代码块**
- 语法高亮正常
- Mac 风格装饰（三个圆点）

## 🎨 测试不同主题

### Default 主题（默认）

```bash
# 修改 test 文件中的配置
# theme: "default"
deno run -A src/test/doocs-md-renderer.test.ts
```

### Grace 主题（优雅）

```bash
# 修改 test 文件中的配置
# theme: "grace"
deno run -A src/test/doocs-md-renderer.test.ts
```

### Simple 主题（简约）

```bash
# 修改 test 文件中的配置
# theme: "simple"
deno run -A src/test/doocs-md-renderer.test.ts
```

## 📱 微信公众号验证

### 步骤 1：复制渲染后的 HTML

```bash
# 打开生成的 HTML 文件
cat test-doocs-md-output.html | pbcopy
```

### 步骤 2：在微信公众号后台测试

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「素材管理」→「新建图文」
3. 切换到「HTML 模式」
4. 粘贴复制的 HTML
5. 切换回「可视化模式」
6. 查看效果

### 步骤 3：检查兼容性

✅ **样式是否保留**
- 标题样式
- 颜色
- 间距

✅ **图片是否正常**
- 能否显示
- 尺寸是否合适

✅ **链接是否可点击**

✅ **整体排版是否美观**

## ⚠️ 常见问题排查

### 问题 1：找不到模块

**错误信息：**
```
Cannot find module '@src/...'
```

**解决方案：**
确保在项目根目录运行命令

### 问题 2：CSS 变量未替换

**症状：**
HTML 中仍有 `var(--md-primary-color)`

**解决方案：**
检查 `processCSSVariables()` 方法是否正常执行

### 问题 3：图片上传失败

**错误信息：**
```
[DoocsMdRenderer] 图片处理失败
```

**解决方案：**
- 检查微信公众号配置
- 确认 `WEIXIN_APP_ID` 和 `WEIXIN_APP_SECRET` 正确
- 测试时可以暂时跳过图片处理

## 📊 性能测试

### 测试脚本

在 `src/test/doocs-md-renderer.test.ts` 中添加：

```typescript
console.time("渲染耗时");
const html = await renderer.render(testArticles);
console.timeEnd("渲染耗时");
```

### 预期结果

- ✅ 渲染耗时 < 100ms
- ✅ 内存占用 < 50MB
- ✅ HTML 大小 < 100KB

## ✅ 测试清单

完成以下测试项，确保渲染器正常工作：

- [ ] 单元测试通过
- [ ] 3 种主题都能正常渲染
- [ ] 生成的 HTML 在浏览器中显示正常
- [ ] 标题、段落、引用样式正确
- [ ] 代码高亮工作正常
- [ ] 图片处理（如果配置了微信）成功
- [ ] 在微信公众号后台预览正常
- [ ] 性能指标符合预期

## 🎯 下一步

测试通过后，您可以：

1. ✅ **正式使用**
   ```bash
   # 在 .env 中永久启用
   USE_DOOCS_MD_RENDERER=true
   ```

2. ✅ **自定义主题**
   - 修改 `weixin-article.workflow.ts` 中的渲染器配置
   - 调整主题色、字体大小等

3. ✅ **监控效果**
   - 观察发布到微信后的实际效果
   - 收集用户反馈
   - 根据需要调整配置

## 📞 需要帮助？

如果测试过程中遇到问题：

1. 查看 [使用指南](./doocs-md-renderer-guide.md)
2. 查看 [集成总结](./doocs-md-integration-summary.md)
3. 检查项目 Issues
4. 联系技术支持

---

**祝测试顺利！** 🎉

