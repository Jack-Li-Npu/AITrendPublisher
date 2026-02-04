# 战胜人工智能翻译模型中的文化偏见
尽管模型提供商正在引入翻译模型，但仍有许多工作需要完成以确保它们能够准确捕捉文化细微差别。
[Esther Shittu](https://aibusiness.com/author/esther-shittu)，新闻撰稿人，AI Business
2026年2月2日
5分钟阅读
![语言插图](https://eu-images.contentstack.com/v3/assets/blt6b0f74e5591baa03/bltbc8885260ceaf36d/6980eca6e2f4a259ec1651b8/Languages.jpg?width=1280&auto=webp&quality=80&format=jpg&disable=upscale)
Getty Images
虽然人工智能的偏见通常表现为大型语言模型有时对不同性别和种族的系统性偏见，但越来越明显的是，模型也可能因为偏好一种语言而产生偏见。
近年来，人们已经采取措施来遏制这种偏好，像谷歌和OpenAI这样的AI模型开发者[创建了翻译模型](https://aibusiness.com/nlp/how-do-large-language-models-work-llm-ai-demystified)。最近，谷歌于1月15日发布了TranslateGemma，该模型在55种语言和500种语言对上进行了训练——这些语言可以轻松地相互翻译。
然而，翻译模型未能捕捉到口语的一些细微差别。[企业AI平台供应商Articul8](https://aibusiness.com/generative-ai/intel-backed-generative-ai-company-launches-aerospace-platform-at-paris-air-show)表示其[LLM-IQ](https://aws.amazon.com/marketplace/pp/prodview-wrdv374halcl4)代理对此提供了更多见解。这个多层次评估系统根据五个定性维度对模型进行评分：流畅性和自然度、连贯性、文化规范、一致性和清晰度。
通过这一框架，Articul8发现许多模型在文化适宜性方面表现不佳，这表明为了让AI技术在全球范围内做好准备，还需要更多的工作。
相关文章：[Anthropic旨在通过Claude宪法实现透明度](https://aibusiness.com/responsible-ai/anthropic-aims-for-transparency-with-constitution)
在这次问答中，Articul8的CEO兼创始人Arun Subramaniyan讨论了开发该框架的原因以及为什么拥有一个文化适宜的模型是至关重要的。
**是什么促使Articul8开发LLM-IQ代理，并且为何专注于AI模型中的翻译细节？**
Arun Subramaniyan: 我们在日本和韩国都有客户。当我们开始在这些地区部署时，我们需要能够理解多种语言的模型。
发生的一件事是，当我们早期部署一些系统时，客户既高兴又不满。
在日本和韩国，他们告诉我们，“你的答案是准确的，但很粗鲁。”
我们说，“好的”，但我们不知道区别在哪里。
但在日语中，还有一个层次，即你所说的内容的背景，比如你在对谁说，谁在说，以及你想从这次对话中得到什么结果。你可以直接、间接、礼貌、过分礼貌或稍微严厉。根据上下文，如果你使用了错误的语气，那也是不正确的。
相关文章：[观点：与影子AI合作而非对抗](https://aibusiness.com/responsible-ai/work-with-not-against-shadow-ai)
这真的引起了我们的兴趣，因为这是更深层次的语言问题。即使这不是一个技术领域，它对于日语来说是一个[特定领域的](https://aibusiness.com/generative-ai/domain-specific-ai-models-poised-to-dominate-enterprise-gartner)语言。
**在什么情况下，一个大语言模型是否礼貌会很重要？**
Subramaniyan: 例如，在[供应链](https://aibusiness.com/agentic-ai/how-to-prepare-supply-chains-for-agentic-ai)中，你不知道某人是在提建议还是下达指令，而这将产生深远的影响。
此外，这也可能带来严重的成本。
如果你有一个汽车系统，它生成了一个建议。人类在循环中读取这些建议。人类不知道是否需要以100%的确定性来执行这些建议。这在一个工业环境中具有深远的影响。
Subramaniyan: 我认为这更像是具有全球洞察力的人与只有本地洞察力的人之间的区别。你需要在当地启用，但要对全球保持乐观。
这是关于立即在日本应用全球学习，同时进行独特的日本本地化。这非常不同，因为你立刻了解了更多关于本地化的信息，但想象一下，你需要在全球范围内操作并拥有所有所需的数据来做你需要做的事情。
**为什么您认为大语言模型似乎无法捕捉到像日语这样的语言的细微差别？**
即使是数字化的非英语内容也主要来自西方或我们无法访问的来源，如中国。
所有的礼貌用语，什么是礼貌和不礼貌，什么被认为是近乎自然的人类互动都来自西方。
**在开发这个框架时，是否有某个[开源模型](https://aibusiness.com/nlp/open-source-vs-closed-models-the-true-cost-of-running-ai)比专有模型表现更好？**
Subramaniyan: 我们对所有开源模型和所有闭源模型进行了基准测试。但随后我们必须从头开始构建这些模型，因为我们必须平衡数据集。如果不平衡数据集，你将会不断遇到同样的偏见。
我们有一个叫做Model Mesh的概念，它使我们能够在运行时决定调用哪些模型。我们不一定需要一个大型通用模型来进行每项任务的微调。我们可以有独立的任务特定模型，然后让它们作为一个系统一起工作。然后这个系统就是一个可以在运行时一起工作的推理引擎。
是的，我们确实使用通用模型来获取关于世界的信息。但是当涉及到日本和日语时，我们有自己的模型。
人们心中的另一个问题是，“哦天哪，我是否需要为每个任务构建庞大的模型？”
答案是否定的，因为我们最终得到了一系列共同成长的模型。如果一个模型在一项任务上做得非常好，那么这会在整体上影响并改进其他模型。