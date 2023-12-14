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


const preamble = `Please respond with a single word or phrase that best captures the theme of the items in the following list:`
// const preamble = `Given these descriptions of Gene Ontology gene sets, please come up with a single short phrase to summarize them as a group:`
const reminder = `Remember, please respond with only one word or phrase.`
// const reminder = `Remember, please respond with only a few words.`

// we will use the following function to make the request to the openai api
async function getLabelFromExtract(extract) {
  const completion = await openai.createChatCompletion({
    // model: "gpt-3.5-turbo",
    // model: "gpt-4",
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "user",
        content: `${preamble}
        ${extract}

        ${reminder}
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
  let tokens = encode(extract)
  console.log('🔢', tokens.length);
  if(tokens.length > 4000) extract = extract.slice(0, 15000)
  tokens = encode(extract)
  if(tokens.length > 4000) extract = extract.slice(0, 10000)
  tokens = encode(extract)
  if(tokens.length > 4000) extract = extract.slice(0, 5000)
  try {
    label = await getLabelFromExtract(extract)
    console.log('🏷️', label);
  } catch (error) {
    console.log(error?.response?.data?.error?.message);
  }  
  // clean up the label with a regex that removes non word characters
  label = label.replace(/[^a-zA-Z0-9 ]/g, '')
  // .replace(/\"/g, '')
  return {cluster: cluster.cluster, label: label}
})

// wait for all the requests to finish
const labels = await Promise.all(clusterLabels);

// save the labels to a json file
fs.writeFileSync(`./data/${name}-cluster-labels.csv`, csvFormat(labels));
