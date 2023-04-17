# Latent Drafting

This repository attempts to simplify a workflow for exploring latent spaces. We draft maps of embeddings via a combination of node scripts, python notebooks and Observable notebooks.



## Reddit embeddings

Download post data from reddit and embed it with OpenAI


~~~bash
# download the top 1000 posts for DataIsBeautiful
node reddit-posts.js dataisbeautiful fetch 1000

#embed the posts
node reddit-embeddings.js dataisbeautiful
~~~

Then we can dimensionality reduce it with UMAP and cluster with HDBSCAN

see `jupyter/Reddit umap.ipynb`

Then we can also generate labels for our clusters:

~~~bash
node cluster-labels.mjs dataisbeautiful
~~~

The results of this process aren't committed to the repo but can be explored here:
https://observablehq.com/@codingwithfire/dataisbeautiful-top-posts


## Simonw Blog entries
Simon Willison publishes a [popular blog on technology](https://simonwillison.net/), and he also [published embeddings](https://datasette.simonwillison.net/simonwillisonblog/blog_entry_embeddings) of his almost 3000 blog posts.

The process is done in `jupyter/simonw umap.ipynb`

The map can be seen here:
https://observablehq.com/@codingwithfire/simonw-blog-entry-map

