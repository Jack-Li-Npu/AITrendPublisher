## 如果你是从 YouTube 视频来的
一些事情已经改变了。技能的完成方式有所不同，现在需要以 `@` 开头。
...我会尽量更新...

### 大型 Twitch 讨论会
我将在1月30日早上8点（蒙大拿时间/山区时间）进行一次直播，深入探讨99及其优缺点。

## Neovim 应得的 AI 代理
这是一个示例仓库，我想测试我认为理想的 AI 工作流程，适用于没有“技能问题”的人。这旨在简化对 AI 的请求，并将其限制在特定区域。对于更通用的请求，请直接使用 opencode，不要使用 neovim。

## 警告
1. 提示是临时的，可能会大幅改进。
2. 支持 TypeScript 和 Lua 语言，欢迎更多支持。
3. 仍处于非常早期的阶段，可能存在严重问题。

## 如何使用
**你必须安装并设置好 opencode**

将以下配置添加到你的 neovim 配置中

假设你正在使用 Lazy
```lua
{
	"ThePrimeagen/99",
	config = function()
		local _99 = require("99")

		-- 如果你希望跟踪请求进行调试，可以将日志记录到文件中
		-- 报告错误时，建议使用 99 提供的日志机制，而不是这个
		local cwd = vim.uv.cwd()
		local basename = vim.fs.basename(cwd)
		_99.setup({
			logger = {
				level = _99.DEBUG,
				path = "/tmp/" .. basename .. ".99.debug",
				print_on_error = true,
			},

			--- 一个围绕标签的新功能
			completion = {
				--- 默认为 .cursor/rules
				-- 我暂时禁用这些规则，直到我更好地理解这个问题
				-- 在光标规则中还有应用规则，这意味着我需要以不同的方式应用它们
				-- cursor_rules = "<自定义光标规则路径>"

				--- 包含你自己的 SKILL.md 文件的文件夹列表
				--- 预期格式：
				--- /path/to/dir/<skill_name>/SKILL.md
				--- 示例：
				--- 输入路径：
				--- "scratch/custom_rules/"
				--- 输出规则：
				--- {path = "scratch/custom_rules/vim/SKILL.md", name = "vim"},
				--- ...该目录中的其他规则...
				custom_rules = {
					"scratch/custom_rules/",
				},

				--- 你使用哪种自动补全。目前仅支持 cmp
				source = "cmp",
			},

			--- 警告：如果你更改了当前工作目录，这可能会出问题
			--- 我会在后续版本中修复这个问题
			--- md_files 是一个文件列表，系统会根据请求的原始位置自动查找并添加这些文件
			--- 例如，如果你在 /foo/bar/baz.lua，系统会自动查找：
			--- /foo/bar/AGENT.md
			--- /foo/AGENT.md
			--- 假设 /foo 是项目根目录（基于当前工作目录）
			md_files = {
				"AGENT.md",
			},
		})

		-- 为不同类型的操作创建快捷键
		vim.keymap.set("n", "<leader>9f", function()
			_99.fill_in_function()
		end)
		-- 注意，视觉选择仅在 v 模式下有效
		-- 实际上，无论你上次的视觉选择是什么，都会被使用
		-- 所以我将其设置为视觉模式，以免误用旧的视觉选择
		-- 可能我会添加模式检查并在断言所需的视觉模式
		-- 现在就做好准备
		vim.keymap.set("v", "<leader>9v", function()
			_99.visual()
		end)

		--- 如果你有一个请求但不想做任何更改，只需取消它
		vim.keymap.set("v", "<leader>9s", function()
			_99.stop_all_requests()
		end)

		--- 示例：使用规则 + 动作进行自定义行为
		--- 创建一个规则文件，如 ~/.rules/debug.md，定义自定义行为
		--- 例如，“debug”规则可以在函数中自动添加 printf 语句，帮助调试执行流程
		vim.keymap.set("n", "<leader>9fd", function()
			_99.fill_in_function()
		end)
	end,
}
```

## 自动补全
在提示时，如果你安装了 cmp 作为自动补全工具，可以使用自动补全来包含规则。

技能自动补全和包含的工作方式是从输入 `@` 开始。

## API
你可以在 [99 API](./lua/99/init.lua) 查看完整的 API。

## 报告错误
要报告错误，请提供完整的运行调试日志。这可能需要一些来回沟通。

请不要请求功能。我们将在 Twitch 上举行公开讨论，这将是更好的起点，而不是关闭一堆请求。如果你提出功能请求，我会立即关闭它。

### 日志
要获取最后一次运行的日志，请执行 `:lua require("99").view_logs()`。如果这不是你需要的日志，你可以通过以下方法导航日志：
```lua
function _99.prev_request_logs() ... end
function _99.next_request_logs() ... end
```

### 不要忘记
如果日志中包含机密信息或其他你不希望分享的信息，请确保删除 `query` 打印。这可能包含你不希望分享的信息。

### 已知的可用性问题
* 长函数定义问题。
```typescript
function display_text(
  game_state: GameState,
  text: string,
  x: number,
  y: number,
): void {
  const ctx = game_state.canvas.getContext("2d");
  assert(ctx, "cannot get game context");
  ctx.fillStyle = "white";
  ctx.fillText(text, x, y);
}
```

然后虚拟文本将显示在“function”下面的一行，而不是在函数体的第一行

* 在 Lua 和可能的 JSDoc 中，替换函数会重复注释定义
  * 这不会发生在语法中有类型的语言中

* 视觉选择会发送整个文件。可能有更好的方法使用 treesitter 来使发送的内容选择更合理。

* 对于填充函数和视觉选择，应该有更好的方法来收集上下文。我认为 treesitter + LSP 可以非常强大。一旦我获得 FIM 模型的访问权限，我会进一步实验。这可以使完成时间缩短到几秒钟以内，这将是非常惊人的。

* 有时替换似乎会出问题，会破坏我当前正在编辑的内容..我认为这可能与自动补全有关
  * 这一点还不确定

* 导出函数...有时也会导出。我认为提示可以帮助防止这种情况。