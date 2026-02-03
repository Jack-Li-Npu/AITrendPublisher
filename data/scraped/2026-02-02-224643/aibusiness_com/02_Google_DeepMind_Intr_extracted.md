# Google DeepMind 为 Gemini 3 Flash 引入代理视觉
新的功能结合了视觉推理和 Python 代码，以改进图像分析并实现主动调查。
[Scarlett Evans](https://aibusiness.com/author/scarlett-evans)，撰稿人
2026年1月29日
阅读时间：1分钟
![Google DeepMind 在伦敦的办公室](https://eu-images.contentstack.com/v3/assets/blt6b0f74e5591baa03/bltb05e3cce6a80ec32/697be1d456130b4cb37e3ad9/deepmind.jpg?width=1280&auto=webp&quality=80&format=jpg&disable=upscale)
Dan Kitwood/Staff via Getty Images
本周，Google DeepMind 为其 Gemini 3 Flash 模型添加了代理视觉功能，将图像分析从被动任务转变为积极任务。
虽然典型的多模态模型在一次“扫视”中处理图像，但通过引入代理能力，Google 允许其模型主动研究图片并专注于特定细节，如路标或微芯片上的序列号。
新功能通过生成并运行 Python 代码来放大、操作和系统地检查图像。
“通过将视觉推理与代码执行相结合，这是代理视觉支持的第一个工具之一，该模型制定了逐步放大、检查和操作图像的计划，并基于视觉证据得出答案，”Google DeepMind 的产品经理 Rohan Doshi 在一篇[博客文章](https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/)中写道。
该功能使用 Think-Act-Observe 循环，Gemini 3 Flash 将研究用户查询和图像，制定计划，使用 Python 代码进行图像分析，然后检查结果，最后生成最终响应。
根据 Google 的说法，此次更新在视觉基准测试中质量提高了 5% 到 10%。
Google 表示，通过 Google AI Studio 已经展示了多种新的代理行为，例如迭代缩放、直接图像注释和可视化绘图。据说后者可以减少幻觉——这是视觉数学任务中的常见问题。
展望未来，该公司表示计划向模型中添加更多隐式代码驱动的行为，这意味着某些目前需要特定提示的功能将成为自主功能。