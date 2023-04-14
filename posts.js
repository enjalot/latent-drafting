// fetch posts from reddit api and process them
/*
Run this script with a number to fetch posts from reddit
node posts.js fetch 1000
This will create a posts/rawPosts.json file with the raw posts from reddit

Run this script as:
node posts.js process
to process the rawPosts into posts/posts.json
*/

const axios = require('axios');
const fs = require('fs');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchTopPosts = async (after) => {
  console.log(`Fetching posts after ${after}`);
  const fetchUrl = `https://www.reddit.com/r/dataisbeautiful/top.json?t=all&limit=100&after=${after}`
  // const fetchUrl = `https://www.reddit.com/r/dataisbeautiful/top.json?t=all&limit=100&count=${after}`
  console.log('🔗 Fetching URL:', fetchUrl);
  const response = await axios.get(fetchUrl);
  return response.data.data.children;
};

const downloadImage = async (url, filename) => {
  const response = await axios({
    url,
    responseType: 'stream'
  });

  // Create a writable stream with the filename
  const fileStream = fs.createWriteStream(filename);

  // Pipe the response data into the fileStream
  response.data.pipe(fileStream);

  console.log(`Downloading image ${filename}`);

  return new Promise((resolve, reject) => {
    fileStream.on('finish', () => {
      console.log(`Finished downloading image ${filename}`);
      resolve();
    });

    fileStream.on('error', () => {
      console.log(`Error downloading image ${filename}`);
      reject()
    });
  });
};

const processPost = async (post, i) => {
  const { data } = post;
  const {
    title,
    score,
    gilded,
    author,
    link_flair_text,
    id,
    url,
    num_comments,
    created_utc
  } = data;

  console.log(`Processing post ${id}, ${i}`);

  // download the thumbnail
  if(data.thumbnail){
    const filename = `./images/${id}.jpg`;
    try {
      if (!fs.existsSync(filename)) {
        await delay(100)
        await downloadImage(data.thumbnail, filename);
      } else {
        console.log("image already downloaded", id, i)
      }
    } catch(e) {
      console.log("error downloading image", id, i)
    }
  } else {
    console.log("no thumbnail", id, i)
  }

  // if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
  //   const filename = `./images/${id}.png`;
  //   if (!fs.existsSync(filename)) {
  //     await downloadImage(url, filename);
  //   }
  // }

  return {
    title,
    score,
    gilded,
    author,
    link_flair_text,
    id,
    url,
    num_comments,
    created_utc
  };
};


async function getPosts(maxPosts) {
  let allPosts = [];
  let after = null;

  // check if we have posts already and start from there
  if (fs.existsSync('./posts/rawPosts.json')) {
    const postsData = JSON.parse(fs.readFileSync('./posts/rawPosts.json', 'utf-8'))
    console.log("raw posts loaded", postsData.length)
    if(postsData.length) {
      allPosts = postsData
      after = "t3_" + allPosts[allPosts.length - 1].data.id;
    }
  }

  while (allPosts.length < maxPosts) {
    const posts = await fetchTopPosts(after);
    // const posts = await fetchTopPosts(allPosts.length);
    if (!posts.length) break;
    allPosts = allPosts.concat(posts);
    after = "t3_" + posts[posts.length - 1].data.id;
    console.log("all posts", allPosts.length)
    fs.writeFileSync('./posts/rawPosts.json', JSON.stringify(allPosts));
    await delay(3000); // Wait 3 seconds between Reddit API requests
  }


  return allPosts;
}

async function processPosts() {

  const postsData = JSON.parse(fs.readFileSync('./posts/rawPosts.json', 'utf-8'))
    console.log("raw posts loaded", postsData.length)
    if(postsData.length) {
      allPosts = postsData

    console.log("processing posts", allPosts.length)
    const processedPosts = await Promise.all(allPosts.map(processPost));
    fs.writeFileSync('./posts/posts.json', JSON.stringify(processedPosts));

    console.log("done processing posts", processedPosts.length)
  }
}

async function main() {
  // if posts directory doesn't exist create it
  if (!fs.existsSync('./posts')) {
    fs.mkdirSync('./posts');
  }
  if (!fs.existsSync('./images')) {
    fs.mkdirSync('./images');
  }

  // if the script is run with an argument, fetch that many posts
  if (process.argv[2] == "fetch") {
    console.log("fetching posts")
    getPosts(process.argv[3] || 1000);
  } else {
    console.log("processing posts")
    processPosts();
  }
}
main();