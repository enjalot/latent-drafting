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