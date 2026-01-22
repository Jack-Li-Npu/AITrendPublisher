import { ConfigManager } from "@src/utils/config/config-manager.ts";
import { EmbeddingFactory } from "@src/providers/embedding/embedding-factory.ts";
import { EmbeddingProviderType } from "@src/providers/interfaces/embedding.interface.ts";
import { VectorService } from "@src/services/vector-service.ts";

Deno.test("Embedding Test", async () => {
  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();
  const vectorService = new VectorService();
  const embedding_model = await EmbeddingFactory.getInstance().getProvider({
    providerType: EmbeddingProviderType.DASHSCOPE,
    model: "text-embedding-v3",
  });

  const rs = await embedding_model.createEmbedding("你好");
  await vectorService.create({
    content: "你好",
    vector: rs.embedding,
    vectorDim: 1024,
    vectorType: "article",
  });
  console.log(rs);
});
