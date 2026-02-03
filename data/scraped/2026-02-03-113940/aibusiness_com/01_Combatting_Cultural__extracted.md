# 应对人工智能模型翻译中的文化偏见

尽管模型提供商正在引入翻译模型，但要确保它们准确捕捉文化细微之处，仍有许多工作要做。

[Esther Shittu](https://aibusiness.com/author/esther-shittu), AI Business 新闻撰稿人
2026 年 2 月 2 日

![语言图示](https://eu-images.contentstack.com/v3/assets/blt6b0f74e5591baa03/bltbc8885260ceaf36d/6980eca6e2f4a259ec1651b8/Languages.jpg?width=1280&auto=webp&quality=80&format=jpg&disable=upscale)

Getty Images

虽然人工智能偏见最常见的是大型语言模型有时对不同性别和种族表现出的系统性偏见，但现在也越来越清楚的是，模型可能会因为偏爱一种语言而对另一种语言产生偏见。

近年来，人们一直在努力遏制这种偏好，包括谷歌和 OpenAI 等人工智能模型开发商[创建翻译模型](https://aibusiness.com/nlp/how-do-large-language-models-work-llm-ai-demystified)。最近，谷歌于 1 月 15 日发布了 TranslateGemma，该模型接受了 55 种语言和 500 种语言对的训练——这些语言可以很容易地从一种翻译成另一种。

然而，翻译模型未能捕捉到口语的一些细微之处。[企业人工智能平台供应商 Articul8](https://aibusiness.com/generative-ai/intel-backed-generative-ai-company-launches-aerospace-platform-at-paris-air-show)表示，其 [LLM-IQ](https://aws.amazon.com/marketplace/pp/prodview-wrdv374halcl4) 代理提供了对此的更深入了解。这个多层评估代理系统在五个定性维度上对模型进行评分：流畅性和自然性、连贯性、文化规范、一致性和清晰度。

通过该框架，Articul8 发现许多模型在文化适当性方面失败了，这表明人工智能技术要准备好在全球范围内使用，还需要做更多的工作。

相关：[Anthropic 旨在通过 Claude 章程实现透明化](https://aibusiness.com/responsible-ai/anthropic-aims-for-transparency-with-constitution)

在本次问答中，Articul8 首席执行官兼创始人 Arun Subramaniyan 讨论了是什么促使了该框架的开发，以及为什么拥有文化上适当的模型至关重要。

是什么促使 Articul8 开发 LLM-IQ 代理，以及为什么它专注于人工智能模型翻译的细微之处？

Arun Subramaniyan：我们在日本和韩国都有客户。当我们开始在这些地区部署时，我们需要真正理解多种语言的模型。

发生的一件事是，当我们早期部署一些系统时，客户既高兴又不高兴。

在日本和韩国，他们告诉我们，“你的答案是准确的，但很粗鲁。”

我们说，“好的”，但我们不知道其中的区别。

但是在日语中，还有一个层次，即你所说内容的上下文，比如你对谁说，谁在说，以及从对话中获得什么结果。你可以直接、间接、礼貌、过于礼貌或略带严厉。根据上下文，如果你使用了错误的，比如说，语调，那也被认为是错误的。

相关：[观点：与影子人工智能合作，而不是对抗](https://aibusiness.com/responsible-ai/work-with-not-against-shadow-ai)

这真的让我们很感兴趣，因为这更多的是在语言层面。即使它不是一个技术领域，它也是日语的[特定领域](https://aibusiness.com/generative-ai/domain-specific-ai-models-poised-to-dominate-enterprise-gartner)语言。

在什么情况下，LLM 礼貌或不礼貌很重要？

Subramaniyan：例如，在[供应链](https://aibusiness.com/agentic-ai/how-to-prepare-supply-chains-for-agentic-ai)中，你不知道某人是在给出建议，还是某人给出了将产生深远影响的指令。

此外，它可能会产生严重的成本。

如果你有一个汽车系统，它正在生成一个建议。环路中的人正在阅读该建议。人类不知道是否需要 100% 确定地执行该建议。这在工业环境中具有深远的影响。

Subramaniyan：我更多地将其视为具有全球洞察力的人，而不是只有本地洞察力的人。你需要能够在本地启用，但要对全球保持乐观。

这是关于全球学习立即应用于日本，并具有独特的日本本地化。这非常不同，因为，是的，你立即了解更多关于本地化的信息，但想象一下在全球范围内运营，拥有你需要做的所有数据。

你认为 LLM 似乎无法捕捉到像日语这样的语言的细微之处的原因是什么？

即使是数字化的非英语内容也主要来自西方或我们无法访问的来源，例如中国。

所有这些礼貌，被认为是礼貌和不礼貌的，被认为是接近自然的人际互动的，都来自西方。

在开发这个框架时，是否有任何[开源模型](https://aibusiness.com/nlp/open-source-vs-closed-models-the-true-cost-of-running-ai)比专有模型效果更好？

Subramaniyan：我们以所有开源模型和所有闭源模型为基准。但是，我们必须从头开始构建这些模型，因为我们必须平衡数据集。如果你不平衡数据集，你将不断地保持相同的偏见。

我们有一个称为 Model Mesh 的概念，它使我们能够在运行时编排和决定调用哪些模型来做什么。我们不一定需要一个大型的、通用的模型，该模型必须针对每个任务进行微调。我们可以拥有独立的、特定于任务的模型，然后使它们作为一个系统协同工作。然后，该系统是一个运行时推理引擎，我们可以一起运行它。

是的，我们确实使用通用模型来获取有关世界的信息。但是，当涉及到日本和日语时，我们有自己的模型。

人们脑海中的另一个问题是，“哦，我的天，我是否需要为每个任务构建大型模型？”

答案是否定的，因为我们最终会得到一个共同成长的模型家族。如果一个模型确实非常擅长一项任务，那么它会以某种方式影响并全面改进。

编者注：为了清晰和简洁，本采访已经过编辑

## 关于作者

AI Business 新闻撰稿人

Esther Shittu 拥有四年的人工智能技术和行业趋势报道经验。作为“Targeting AI”播客的联合主持人，她与思想领袖和从业者探讨关键的人工智能发展。在加入 AI Business 之前，她曾为多家出版物撰稿，包括《纽约每日新闻》、《Bklyner》和《布鲁克林每日鹰报》。当她没有深入研究人工智能世界时，她会将时间花在热情项目和抚养她的三个女儿上。