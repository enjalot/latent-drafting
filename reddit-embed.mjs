import { getEmbeddings, saveEmbeddings } from "./embeddings.mjs";
import * as fs  from "fs";

async function main() {
  let sub = process.argv[2];

  const processedPosts = JSON.parse(
    fs.readFileSync(`./data/${sub}-posts.json`, "utf-8")
  );
  const embeddings = await getEmbeddings(
    processedPosts,
    (d) => d.id,
    (d) => d.title + "\n" + d.selftext
  );

  saveEmbeddings(embeddings, sub);
}
main();
