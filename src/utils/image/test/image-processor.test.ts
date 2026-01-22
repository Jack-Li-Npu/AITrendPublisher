import { WeixinImageProcessor } from "../image-processor.ts";
import { WeixinPublisher } from "@src/modules/publishers/weixin.publisher.ts";
import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { assertEquals } from "https://deno.land/std@0.217.0/assert/mod.ts";

Deno.test("WeixinImageProcessor 应该能正确处理文章中的图片", async () => {
  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();
  const weixinPublisher = new WeixinPublisher();
  const imageProcessor = new WeixinImageProcessor(weixinPublisher);

  const content = `
        # 测试文章
        ![示例图片](https://oss.liuyaowen.cn/images/202503081200663.png)
        <img src="https://oss.liuyaowen.cn/images/%E3%80%90%E5%93%B2%E9%A3%8E%E5%A3%81%E7%BA%B8%E3%80%912024-11-09%2010_13_12.png" alt="另一张图片">
    `;

  const result = await imageProcessor.processContent(content);

  console.log(result);

  // 验证结果包含必要的字段
  assertEquals(result.results.length, 2);
});
