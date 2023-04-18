import { Configuration, OpenAIApi } from "openai"
import fs from "fs";
import { encode } from "gpt-3-encoder"
import dotenv from "dotenv";
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function processInBatches(items, batchSize, processItemFn, delay = 0) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processItemFn));

    results.push(...batchResults);

    // If there's still more items to process, wait for the specified delay.
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}

export async function getEmbeddings(
  array,
  id = (d, i) => i,
  text = (d, i) => JSON.stringify(d),
  delay = 10
) {
  
  async function getEmbedding(d, i) {
    const itemId = id(d, i);

    console.log(`Getting embedding for item ${itemId}`);
    let str = text(d, i)

    if(encode(str).length > 4000) {
      str = str.slice(0, 15000)
      console.log("Warning: text is too long. Truncating to 15000 characters.", itemId)
    }
    let result;
    try {
      const openAIResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: str
      });
      let data = openAIResponse.data;
      let embedding = data.data[0].embedding;
      result = {
        // ...openAIResponse.data,
        metadata: {
          id: itemId,
          total_tokens: data.total_tokens,
          model: data.model,
          dimensions: embedding.length,
        },
        embedding,
      };

      // Save the embedding to a file
      // fs.writeFileSync(embeddingFilename, JSON.stringify(embedding));
    } catch (error) {
      console.log(error?.response?.data);
    }

    return result;
  }
  console.log("Getting embeddings");
  const embeddings = await processInBatches(array, 5, getEmbedding, delay);
  console.log("# of embeddings", embeddings.length);
  if (embeddings.length !== array.length) {
    console.log(
      "WARNING: number of items and number of embeddings don't match. Be sure to use the id to match them up"
    );
  }
  return embeddings;
};

export function saveEmbeddings(embeddings, name) {

  console.log("writing", `./data/${name}-embeddings.json`)
  const metadataArray = embeddings.map((d) => d.metadata);
  fs.writeFileSync(
    `./data/${name}-embeddings.json`,
    JSON.stringify(metadataArray)
  );

  console.log("writing", `./data/${name}-embeddings.bin`)
  const flat = embeddings.flatMap((d) => d.embedding);
  const combinedArray = Float64Array.from(flat);
  const combinedBuffer = Buffer.from(combinedArray.buffer);
  fs.writeFileSync(`./data/${name}-embeddings.bin`, combinedBuffer);
}

