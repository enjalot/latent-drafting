/*
Usage: node embed-csv.mjs <filename> <column> <id>
*/

import { getEmbeddings, saveEmbeddings } from "./embeddings.mjs";
import * as fs  from "fs";
import csv from 'csv-parser'
// import { csvParse } from "d3"

async function main() {
  // file is expected to be in ./data folder
  let filename = process.argv[2]
    .replace("./data/", "")
    .replace("data/", "");
  // the column with the text to embed
  let column = process.argv[3];
  // optional column with the id
  let id = process.argv[4];
  let filepath = `./data/${filename}`
  // load the csv
  // const csv = fs.readFileSync(filepath, "utf-8");

  // parse the csv
  // const extracts = csvParse(csv)
  const extracts = [];

  console.log("reading", filepath)
  fs.createReadStream(filepath)
    .pipe(csv())
    .on('data', (data) => extracts.push(data))
    .on('end', async () => {
      console.log("read", filepath)
      // Handle results
      console.log("first entry:")
      console.log(extracts[0])

      let len = extracts.length;
      console.log("Number of rows", len);

      const embeddings = await getEmbeddings(
        extracts,
        (d,i) => id ? d[id] : i,
        (d) => d[column],
        10,
        500
      );

      saveEmbeddings(embeddings, filename.replace('.csv', ''));
    });
}
main();
