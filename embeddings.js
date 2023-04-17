const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const getEmbeddings = async (posts) => {
  console.log("Getting embeddings");
  const embeddings = await Promise.all(
    posts.map(async (post) => {
      const postId = post.id;
      
      console.log(`Getting embedding for post ${postId}`);
      let result;
      try {
        const openAIResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          // input: JSON.stringify(post),
          input: post.title
        });
        let data = openAIResponse.data
        let embedding = data.data[0].embedding
        result = {
          // ...openAIResponse.data,
          metadata: {
            id: postId,
            total_tokens: data.total_tokens,
            model: data.model,
            dimensions: embedding.length
          },
          embedding
        };

        // Save the embedding to a file
        // fs.writeFileSync(embeddingFilename, JSON.stringify(embedding));
      } catch (error) {
        console.log(error);
      }

      return result;
    })
  );

  return embeddings;
};

async function main() {
  let sub = process.argv[2]
  
  const processedPosts = JSON.parse(
    fs.readFileSync(`./data/${sub}-posts.json`, "utf-8")
  );
  const embeddings = await getEmbeddings(processedPosts);
  console.log("# of embeddings", embeddings.length);
  if(processedPosts.length !== embeddings.length) {
    console.log("WARNING: number of posts and embeddings don't match. Be sure to use the id to match them up")
  }

  const floatArrays = embeddings.map(d => Float64Array.from(d.embedding));
  const combinedArray = Float64Array.from(floatArrays.flat());
  const combinedBuffer = Buffer.from(combinedArray.buffer);
  fs.writeFileSync(`./data/${sub}-embeddings.bin`, combinedBuffer);

  // Save the metadata as a separate JSON file
  const metadataArray = embeddings.map(d => d.metadata);
  fs.writeFileSync(`./data/${sub}-embeddings.json`, JSON.stringify(metadataArray));

}
main();
