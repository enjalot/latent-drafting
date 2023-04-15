# Reddit embeddings

Download post data from reddit and embed it with OpenAI


~~~bash
# download the top 1000 posts for DataIsBeautiful
node posts.js fetch 1000
# procses the posts
node posts.js process

#embed the posts
node embeddings.js
~~~

Then we can dimensionality reduce it with UMAP and cluster with HDBSCAN

see `Reddit umap.ipynb`

The results of this process aren't committed to the repo but can be explored here:
https://observablehq.com/@codingwithfire/dataisbeautiful-top-posts