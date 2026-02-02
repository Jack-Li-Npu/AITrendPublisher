Infrastructure
By [Rithula Nisha Ebrahim](https://aimagazine.com/author/rithula-nisha-ebrahim)
January 27, 2026
![](https://assets.bizclikmedia.net/138/f3e2263c60f0673d2e8b70793d51b7fe:1605bbc6bffa51db73595d08b25ff657/maia-200-microsoft-azure.webp)
Microsoft's first in-house AI accelerator focused on inference, Maia 200 (Credit: Microsoft)
Microsoft has unveiled Maia 200, a high-performance AI accelerator built for low-latency inference and improved efficiency to handle modern AI systems
[Microsoft](https://aimagazine.com/news/microsofts-power-problem-ai-chips-are-sitting-in-inventory) has unveiled Maia 200, its first in-house AI accelerator designed specifically for inference workloads, now operational in Azure data centres.
Manufactured using TSMC's three-nanometre process and featuring a redesigned memory architecture, the chip is engineered for large-scale AI applications, delivering high efficiency and performance per dollar.
The development could signal a significant shift in how hyperscalers approach [AI infrastructure](https://aimagazine.com/interviews/ensono-building-resilient-infrastructure-for-the-ai-era), moving towards custom silicon designed for specific AI tasks rather than relying solely on third-party GPU solutions.
![Youtube Placeholder](https://i.ytimg.com/vi/bGecvPR2QWo/hqdefault.jpg)
Maia 200 is equipped with 216 GB of HBM3e memory, providing 7 TB/s bandwidth, 272 MB on-chip SRAM and data movement engines designed to maintain large language model activity.
The chip targets inference applications including token generation and synthetic data pipelines, with reported use cases encompassing work with OpenAI's GPT-5.2 models and internal model development by Microsoft's [Superintelligence](https://aimagazine.com/news/mark-zuckerbergs-personal-superintelligence-explained) team.
These capabilities suggest the chip is positioned to handle the increasingly complex demands of modern AI systems, where inference workloads often account for the majority of computational costs in production environments.
Writing on LinkedIn, Scott Guthrie, Executive Vice President at Microsoft, says. "As AI workloads get bigger and more complex, we are engineering the full stack from our custom-built silicon all the way to the data centre. Today we launched Maia 200, our next-generation AI accelerator chip.
![](https://assets.bizclikmedia.net/668/da359f193a34e713114c83823a50fd5f:961800047500a2587764a72aad6b1e3d/graphics-for-work-2026-01-27t124458-094.jpg)
Scott Guthrie, Executive Vice President at Microsoft
"Maia 200 is an AI inference powerhouse: the most performant first-party silicon from any hyperscaler, with three times the FP4 performance of Amazon's third-generation Trainium and FP8 performance above Google's seventh-generation TPU.
"It's also the most efficient inference system we've ever deployed, delivering 30% better performance per dollar than the latest hardware in our fleet."
Each Maia 200 chip houses more than 140 billion transistors and delivers more than 10 petaflops of 4-bit precision (FP4) and more than five petaflops of 8-bit (FP8) performance, all within a 750 W SoC thermal envelope.
These specifications are optimised for low-precision compute used in modern inference models.
The focus on lower precision compute reflects industry trends towards more efficient AI processing, where inference tasks can often operate effectively with reduced numerical precision compared to training workloads.
This architecture improves the rate at which tokens are processed and models are fed with new inputs, potentially reducing latency in real-time AI applications.
![](https://assets.bizclikmedia.net/668/a15961972d1d1e768c0701cb9c06171d:1332a6db03d3946ebd1ccd01f8f9384c/maia-200-info-graphic-from-microsoft-azure-showing-the-capability.png)
Maia 200 info-graphic from Microsoft Azure, showing the capability (Credit: Microsoft)
## Scalable network architecture design
At the system level, Maia 200 introduces a two-tier scale-up network architecture using standard Ethernet rather than proprietary fabrics. This approach enables broad scalability and cost efficiency while maintaining high performance and reliability.
Each Maia accelerator connects with 2.8 TB/s of dedicated, bidirectional scale-up bandwidth and supports collective operations across clusters of up to 6,144 accelerators.
Inside each tray, four accelerators are linked directly with non-switched connections, ensuring high-bandwidth local communication.
The same transport protocols are used across trays, racks and entire clusters, creating a consistent and programmable fabric for inference workloads.
This unified networking design could simplify cluster management, minimise network latency and reduce power consumption, potentially lowering total cost of ownership across [Microsoft's Azure](https://aimagazine.com/news/how-microsoft-azure-will-transform-checkout-com-payments) fleet.
![](https://assets.bizclikmedia.net/668/884e0735a0c42aebcb5c2ef5c2d7e9fc:7f409cf1774cc47bd9734bebd00b849f/server-blade.png)
Maia 200 server blade (Credit: Microsoft)
## Integrated software and deployment
Maia 200 is now deployed in Microsoft's US Central data centre region near Des Moines, Iowa, with the US West 3 region near Phoenix, Arizona scheduled next.
The chip is fully integrated with Azure's control plane and services, with native support for security, telemetry and diagnostics at the chip and rack levels.
Microsoft is previewing the Maia software development kit (SDK) alongside the hardware rollout. The SDK includes integration with PyTorch, a Triton compiler, optimised kernel libraries and access to a low-level programming language designed for Maia. Developers can use the SDK to port models across hardware targets or tune performance for specific use cases.
To reduce deployment time, Microsoft begins validating its silicon and systems before fabrication. Maia 200 is developed using a pre-silicon modelling environment that simulates LLM workloads in detail, enabling optimisation across silicon, networking and software before production.
According to Microsoft, Maia 200 is production-ready within days of silicon arrival and installed in data centres in less than half the time of prior infrastructure programmes.