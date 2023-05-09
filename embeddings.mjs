import { Configuration, OpenAIApi } from "openai"
import fs from "fs";
import { encode, decode } from "gpt-3-encoder"
import dotenv from "dotenv";
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// this batches requests to keep from spamming the rate limit
async function processInBatches(items, batchSize, processItemFn, delay = 0) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((b,j) => processItemFn(b, i + j)));

    results.push(...batchResults);

    // If there's still more items to process, wait for the specified delay.
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}

// This batches prompts into a single request to the API
async function processInAPIBatches(items, batchSize, processBatchFn, delay = 0) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    // const batchResults = await Promise.all(batch.map((b,j) => processItemFn(b, i + j)));
    const batchResults = await processBatchFn(batch, i)
    results.push(...batchResults);

    // If there's still more items to process, wait for the specified delay.
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}

function prepPrompt(str, row_index) {
  if(!str) str = " "; // openai doesn't like empty strings
  let tokens = encode(str);
  if(tokens.length > 4000) {
    str = decode(tokens.slice(0, 4000))
    console.log(`Warning: text is too long. Truncating ${tokens.length} to 4000 tokens.`, row_index)
  }
  return { str, row_index }
}

export async function getEmbeddings(
  array,
  id = (d, i) => i,
  text = (d, i) => JSON.stringify(d),
  delay = 10,
  batchSize = 5
) {


  async function getEmbeddingBatch(items, i) {
    let prompts = items.map((d, j) => prepPrompt(text(d), i + j))
    let results = []

    console.log("Getting embeddings for batch", prompts[0], "to",prompts[prompts.length-1])//prompts.map(d => d.row_index))
    try {
      const openAIResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: prompts.map(d => d.str)
      });
      let data = openAIResponse.data;
      // console.log("API RESPONSE DATA", data)
      
      data.data.forEach(d => {
        results[d.index] = {
          metadata: {
            row_index: prompts[d.index].row_index,
            text: items[d.index].text,
            extract: prompts[d.index].str,
            total_tokens: data.usage.total_tokens,
            model: data.model,
            dimensions: d.embedding.length,
          },
          embedding: d.embedding, 
        }
      })

    } catch (error) {
      console.log("ERROR", error?.response?.data?.error?.message);
      throw new Error(error?.response?.data?.error?.message)
    }
    console.log("Got embeddings for batch")
    return results;
  }
  
  async function getEmbedding(d, i) {
    const itemId = id(d, i);

    console.log(`Getting embedding for item ${itemId}`);
    let str = text(d, i)

    let encoded = encode(str)
    if(encoded.length > 4000) {
      str = decode(encoded.slice(0, 4000))
      console.log("Warning: text is too long. Truncating to 15000 characters.", itemId)
    }
    let result;
    try {
      const openAIResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: str
      });
      let data = openAIResponse.data;
      console.log(i, str)
      console.log("API RESPONSE DATA", i, data)
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
      console.log("ERROR", error?.response?.data?.error?.message);
      // throw new Error(error?.response?.data?.error?.message)
    }
    return result;
  }

  console.log("Getting embeddings");
  // const embeddings = await processInBatches(array, batchSize, getEmbedding, delay);
  const embeddings = await processInAPIBatches(array, batchSize, getEmbeddingBatch, delay);

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

