// const fs = require("fs");
// import fs instead
import fs from "fs";
// const { Configuration, OpenAIApi } = require("openai");
import { Configuration, OpenAIApi } from "openai";
// const dotenv = require("dotenv");
import dotenv from "dotenv";
// add d3-dsv
// const d3 = require("d3-dsv");
import { csvParse } from "d3-dsv";
dotenv.config();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
// load cluster titles csv from clustertitles.csv
const clusterTitleCsv = fs.readFileSync("./clustertitles.csv", "utf-8");

// parse the csv
const clusterTitles = csvParse(clusterTitleCsv).map((row) => row.titles);

// now we are going to map over every cluster title, make a request to the openai api, and use the response to label the cluster based on the titles
// we will then save the cluster labels to a json file

// we will use the following function to make the request to the openai api
async function getLabelFromTitles(titleString) {
  const completion = await openai.createChatCompletion({
    // model: "gpt-3.5-turbo",
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: `Please respond with a cluster name that best captures the theme of all of the titles in the following list:
        ${titleString}

        Make sure your response is only a word or phrase.
        `
      },
      // {
      //   role: "user",
      //   content: `Please respond with an emoji that best captures the theme of all of the titles in the following list:
      //   ${titleString}

      //   If an Emoji alone is not enough to summarize all of the titles, you may use up to 3 additional words to describe the theme of the cluster. If you use more than 3 words, your response will be rejected and you will be severely penalized.
      //   `
      // },
      // {
      //   role: "user",
      //   content: `The following is a list of Reddit post titles:
      //   ${titleString}

      //   Please write a short summary of the topic of this cluster, and why these posts are grouped together. Use your expert understanding of Reddit to summarizy why these posts did well on Reddit, and why they are grouped together in this cluster. Please keep your answer to a paragraph or so. Use a smart, authoritative, journalistic tone.
      //   `
      // },
    ]
  });
  const aiResponse = completion.data.choices[0].message.content;
  return aiResponse;
}

// now we will map over the cluster titles, make the request to the openai api, and save the response to a json file
const clusterLabels = clusterTitles.map(async (titleString) => {
  console.log('📚', titleString);
  let label = ''
  try {
    label = await getLabelFromTitles(titleString);
    console.log('🏷️', label);
  } catch (error) {
    console.log(error);
  }  
  return label;
})

// wait for all the requests to finish
const labels = await Promise.all(clusterLabels);

// save the labels to a json file
fs.writeFileSync("./cluster_labels.json", JSON.stringify(labels));
