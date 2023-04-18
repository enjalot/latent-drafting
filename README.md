# Latent Drafting

This repository attempts to simplify a workflow for exploring latent spaces. We draft maps of embeddings via a combination of node scripts, python notebooks and Observable notebooks.


## Embed any csv

If you have a csv file where you'd like to embed the text in a given column, you can do so with this command:
~~~bash
node embed-csv.mjs <filename> <text column> <id column>
~~~
If there is no id column it will use the row # in the input csv as the id. It expects the csv file to be in the data/ directory.

## Reddit embeddings

You can download up to 1000 top posts for any subreddit via the reddit API. We then embed the title and selftext for all the posts.

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

