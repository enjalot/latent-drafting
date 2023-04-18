import fs from "fs";
import { Configuration, OpenAIApi } from "openai";
import { encode } from "gpt-3-encoder"
import { csvParse, csvFormat } from "d3-dsv";

import dotenv from "dotenv";
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// we will use the following function to make the request to the openai api
async function getLabelFromExtract(extract) {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    // model: "gpt-4",
    messages: [
      {
        role: "user",
        content: `Please respond with a single word or phrase that best captures the theme of all of the titles in the following list:
        ${extract}

        Remember, please respond with only one word or phrase.
        `
      },
    ]
  });
  const aiResponse = completion.data.choices[0].message.content;
  return aiResponse;
}

let name = process.argv[2];

// load the csv
const clusterExtractCsv = fs.readFileSync(`./data/${name}-cluster-extract.csv`, "utf-8");

// parse the csv
const clusterExtracts = csvParse(clusterExtractCsv)


// now we will map over the clusters, make the request to the openai api, and save the response to a csv file
const clusterLabels = clusterExtracts.map(async (cluster) => {
  console.log('📚', cluster.cluster, cluster.extract.length);
  let extract = cluster.extract;
  let label = ''
  let tokens = encode(cluster.extract)
  console.log('🔢', tokens.length);
  if(tokens.length > 4000) extract = cluster.extract.slice(0, 15000)
  try {
    label = await getLabelFromExtract(extract)
    console.log('🏷️', label);
  } catch (error) {
    console.log(error.data);
  }  
  return {cluster: cluster.cluster, label: label.replace(/\"/g, '')}
})

// wait for all the requests to finish
const labels = await Promise.all(clusterLabels);

// save the labels to a json file
fs.writeFileSync(`./data/${name}-cluster-labels.csv`, csvFormat(labels));
