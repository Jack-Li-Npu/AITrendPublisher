import { EmbeddingFactory } from "@src/providers/embedding/embedding-factory.ts";
import { EmbeddingProviderType } from "@src/providers/interfaces/embedding.interface.ts";

async function main() {
  try {
    // 获取 DashScope embedding provider
    const factory = EmbeddingFactory.getInstance();
    const provider = await factory.getProvider(EmbeddingProviderType.DASHSCOPE);

    // 生成文本的 embedding
    const text = "The clothes are of good quality and look good, definitely worth the wait. I love them.";
    const result = await provider.createEmbedding(text, {
      dimensions: 1024,
      encoding_format: "float"
    });

    console.log("Embedding result:", {
      model: result.model,
      dimensions: result.dimensions,
      embedding: result.embedding.slice(0, 5) // 只显示前5个维度作为示例
    });

    // 使用 OpenAI embedding provider
    const openaiProvider = await factory.getProvider(EmbeddingProviderType.OPENAI);
    const openaiResult = await openaiProvider.createEmbedding(text, {
      dimensions: 1536, // OpenAI 的默认维度
      encoding_format: "float"
    });

    console.log("OpenAI Embedding result:", {
      model: openaiResult.model,
      dimensions: openaiResult.dimensions,
      embedding: openaiResult.embedding.slice(0, 5) // 只显示前5个维度作为示例
    });
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
}

main(); 