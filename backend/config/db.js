// const mongoose = require('mongoose');
// require('dotenv').config({path: './../.env'});
// // MongoDB schema for storing subreddit posts and tracking posted content

// const redditPostSchema = new mongoose.Schema({
//     subreddit: String,
//     postId: String, // Reddit post ID to avoid duplicates
//     postedCount: Number,
//     addedAt: Date,
//   });
  
//   const RedditPost = mongoose.model('RedditPost', redditPostSchema);
  
//   // Connect to MongoDB
//   mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });




//   module.exports = mongoose;


// mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

const redditPostSchema = new mongoose.Schema({
  subreddit: String,
  postId: String,
  postedCount: Number,
  addedAt: Date,
});

const RedditPost = mongoose.model('RedditPost', redditPostSchema);

async function connectDB() {
  try {
    await mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

async function savePost(post) {
  const newPost = new RedditPost({
    subreddit: post.subreddit,
    postId: post.postId,
    postedCount: 1,
    addedAt: new Date(),
  });
  await newPost.save();
  console.log(`Post saved to DB: ${post.title}`);
}

async function findPostById(postId) {
  return await RedditPost.findOne({ postId });
}

module.exports = { connectDB, savePost, findPostById };
