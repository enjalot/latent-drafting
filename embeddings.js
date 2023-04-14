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
      const embeddingFilename = `./embeddings/${postId}.json`;

      if (fs.existsSync(embeddingFilename)) {
        console.log(`Loading embedding from file ${embeddingFilename}`);
        const embeddingData = fs.readFileSync(embeddingFilename, "utf-8");
        return JSON.parse(embeddingData);
      }

      console.log(`Getting embedding for post ${postId}`);
      let embedding = null;
      try {
        const openAIResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input: JSON.stringify(post),
        });
        embedding = {
          ...openAIResponse.data,
          id: postId,
        };

        // Save the embedding to a file
        fs.writeFileSync(embeddingFilename, JSON.stringify(embedding));
      } catch (error) {
        console.log(error);
      }

      return embedding;
    })
  );

  return embeddings;
};

async function main() {
  if (!fs.existsSync("./embeddings")) {
    fs.mkdirSync("./embeddings");
  }
  const processedPosts = JSON.parse(
    fs.readFileSync("./posts/posts.json", "utf-8")
  );
  const embeddings = await getEmbeddings(processedPosts);
  console.log("embeddings", embeddings.length);

  const embeddingMap = {};
  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];
    const { id } = embedding;
    embeddingMap[id] = embedding;
  }

  const embeddingCount = Object.keys(embeddingMap).length;
  console.log(`Total number of embeddings: ${embeddingCount}`);

  const imageCount = fs.readdirSync("./images").length;
  console.log(`Total number of images: ${imageCount}`);

  fs.writeFileSync("./embeddingMap.json", JSON.stringify(embeddingMap));

  for (let i = 0; i < embeddings.length; i++) {
    fs.writeFileSync(
      `./embeddings/${embeddings[i].id}.json`,
      JSON.stringify(embeddings[i])
    );
  }
  console.log("Finished");
}
main();
