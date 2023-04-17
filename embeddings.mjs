import { Configuration, OpenAIApi } from "openai"
import * as fs  from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function getEmbeddings(
  array,
  id = (d, i) => i,
  text = (d, i) => JSON.stringify(d)
) {
  console.log("Getting embeddings");
  const embeddings = await Promise.all(
    array.map(async (d, i) => {
      const itemId = id(d, i);

      console.log(`Getting embedding for item ${itemId}`);
      let result;
      try {
        const openAIResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input: text(d, i),
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
        console.log(error);
      }

      

      return result;
    })
  );

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

