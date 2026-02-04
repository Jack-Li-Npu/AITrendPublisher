# Google DeepMind 为 Gemini 3 Flash 引入代理视觉功能

新功能将视觉推理与 Python 代码相结合，以改进图像分析并实现主动调查。

![位于英国伦敦的 Google DeepMind 办公室](https://eu-images.contentstack.com/v3/assets/blt6b0f74e5591baa03/bltb05e3cce6a80ec32/697be1d456130b4cb37e3ad9/deepmind.jpg?width=1280&auto=webp&quality=80&format=jpg&disable=upscale)

Google DeepMind 本周为其 Gemini 3 Flash 模型添加了代理视觉功能，将图像分析从被动任务转变为主动任务。

虽然典型的多模态模型通过单次“扫视”处理图像，但通过引入代理功能，Google 使其模型能够主动研究图片并聚焦于特定细节，例如路标或微芯片上的序列号。

这项新功能通过生成并运行 Python 代码来工作，该代码可以系统地放大、处理和检查图像。

Google DeepMind 的产品经理 Rohan Doshi 在一篇关于此公告的[博客文章](https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/)中写道：“通过将视觉推理与代码执行（代理视觉支持的首批工具之一）相结合，模型可以制定计划，逐步放大、检查和操作图像，将答案建立在视觉证据之上。”

该功能使用“思考-行动-观察”循环，即 Gemini 3 Flash 将研究用户查询和图像并制定计划，使用 Python 代码主动进行图像分析，然后在生成最终响应之前检查结果。

根据 Google 的说法，此次更新在视觉基准测试中实现了 5% 到 10% 的质量提升。

Google 表示，通过 Google AI Studio，此次更新已经展示了一系列新的代理行为，例如迭代缩放、直接图像标注和视觉绘图。据说后者可以减少幻觉——这是视觉数学任务中的一个常见问题。

展望未来，该公司表示计划向模型中添加更多隐式的代码驱动行为，这意味着目前需要特定提示的某些功能将变为自主功能。