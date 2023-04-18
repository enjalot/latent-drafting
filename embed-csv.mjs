import { getEmbeddings, saveEmbeddings } from "./embeddings.mjs";
import * as fs  from "fs";
import { csvParse } from "d3"

async function main() {
  // file is expected to be in ./data folder
  let filename = process.argv[2]
    .replace("./data/", "")
    .replace("data/", "");
  // the column with the text to embed
  let column = process.argv[3];
  // optional column with the id
  let id = process.argv[4];

  // load the csv
  const csv = fs.readFileSync(`./data/${filename}`, "utf-8");

  // parse the csv
  const extracts = csvParse(csv)

  const embeddings = await getEmbeddings(
    extracts,
    (d,i) => id ? d[id] : i,
    (d) => d[column]
  );

  saveEmbeddings(embeddings, filename.replace('.csv', ''));
}
main();
