const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Snoowrap = require('snoowrap');
require('dotenv').config();
const cron = require('node-cron');
const app = express();
app.use(express.json());
const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http')

const router = express.Router();

const redditPostSchema = new mongoose.Schema({
  subreddit: String,
  postId: String,
  mediaUrl: String,
  addedAt: Date,
});

const RedditPost = mongoose.model('RedditPost', redditPostSchema);


const facebookPostSchema = new mongoose.Schema({
  postId: String,
  message: String,
  mediaUrl: String,
  addedAt: Date,
});

const FacebookPost = mongoose.model('FacebookPost', facebookPostSchema);


const imgurPostSchema = new mongoose.Schema({
  postId: String,
  title: String,
  mediaUrl: String,
  addedAt: Date,
});

const ImgurPost = mongoose.model('ImgurPost', imgurPostSchema);


const rejectedPostSchema = new mongoose.Schema({
  postId: String,
  platform: String,
  reason: String,
  addedAt: Date,
});

const RejectedPost = mongoose.model('RejectedPost', rejectedPostSchema);


mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err.message));


async function isPostProcessedOrRejected(postId, platform) {
  try {
    const processed = await RedditPost.findOne({ postId }) || await FacebookPost.findOne({ postId }) || await ImgurPost.findOne({ postId });
    const rejected = await RejectedPost.findOne({ postId, platform });
    return processed !== null || rejected !== null;
  } catch (error) {
    console.log(`Error checking post status for ${platform} post ${postId}:`, error.message);
    return false;
  }
}


async function fetchRedditPosts() {
  console.log('Attempting to fetch Reddit posts...');
  try {
    const r = new Snoowrap({
      userAgent: 'ProjectX/1.0.0 Retr0',
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD,
    });

    const subreddits = await r.getSubscriptions({ limit: 10 });
    const subredditNames = subreddits.map((subreddit) => subreddit.display_name);

    const posts = [];
    for (const subredditName of subredditNames) {
      const subredditPosts = await r.getTop(subredditName, { time: 'day', limit: 2 });
      for (const post of subredditPosts) {
        if (post.url && !post.is_video && /\.(jpg|jpeg|png|bmp|gif)$/i.test(post.url)) { 
          const redditPostUrl = `https://reddit.com${post.permalink}`;
          if (!(await isPostProcessedOrRejected(post.id, 'Reddit'))) {
            posts.push({
              postId: post.id,
              subreddit: post.subreddit.display_name,
              title: post.title,
              mediaUrl: post.url,
              redditUrl: redditPostUrl,
            });
          }
        } else {
          console.log(`Skipping post ${post.id} due to unsupported media type.`);
          await saveRejectedPost(post.id, 'Reddit', 'Unsupported media type');
        }
      }
    }

    console.log(`Successfully fetched ${posts.length} Reddit posts.`);
    return posts.slice(0, 3); 
  } catch (error) {
    console.log('Error fetching Reddit posts:', error.message);
    return [];
  }
}


async function fetchFacebookPosts() {
  console.log('Attempting to fetch Facebook posts...');
  try {
    const fbResponse = await axios.get('https://graph.facebook.com/v17.0/me/feed', {
      params: { access_token: process.env.FACEBOOK_ACCESS_TOKEN },
    });

    const posts = fbResponse.data.data.map((post) => ({
      postId: post.id,
      message: post.message,
      mediaUrl: post.full_picture || null,
    }));

    const validPosts = [];
    for (const post of posts) {
      if (post.mediaUrl && /\.(jpg|jpeg|png|bmp|gif)$/i.test(post.mediaUrl) && !(await isPostProcessedOrRejected(post.postId, 'Facebook'))) {
        validPosts.push(post);
      } else if (post.mediaUrl && !(await isPostProcessedOrRejected(post.postId, 'Facebook'))) {
        console.log(`Skipping Facebook post ${post.postId} due to unsupported media type.`);
        await saveRejectedPost(post.postId, 'Facebook', 'Unsupported media type');
      }
    }

    console.log(`Successfully fetched ${validPosts.length} Facebook posts.`);
    return validPosts.slice(0, 1); // Limit to 1 Facebook post for simplicity
  } catch (error) {
    console.log('Error fetching Facebook posts:', error.message);
    return [];
  }
}

// Function to fetch Imgur memes (images only)
// async function fetchImgurMeme() {
//   console.log('Attempting to fetch Imgur memes...');
//   try {
//     const imgurResponse = await axios.get('https://api.imgur.com/3/gallery/t/dankmemes', {
//       headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` },
//     });

//     const memes = imgurResponse.data.data.items.filter((item) => item.images);
//     if (memes.length === 0) {
//       console.log('No dank memes found on Imgur.');
//       return null;
//     }

//     for (const meme of memes) {
//       if (meme.images[0].type.startsWith('image/') && !(await isPostProcessedOrRejected(meme.id, 'Imgur'))) {
//         console.log(`Fetched Imgur meme: ${meme.title}`);
//         return { postId: meme.id, title: meme.title, mediaUrl: meme.images[0].link };
//       } else if (meme.images[0].type.startsWith('image/')) {
//         console.log(`Skipping Imgur meme ${meme.id} due to unsupported media type.`);
//         await saveRejectedPost(meme.id, 'Imgur', 'Unsupported media type');
//       }
//     }

//     console.log('All Imgur memes have been posted or rejected.');
//     return null;
//   } catch (error) {
//     console.log('Error fetching Imgur memes:', error.message);
//     return null;
//   }
// }

async function fetchImgurMeme() {
  console.log('Attempting to fetch Imgur memes...');
  try {
    const imgurResponse = await axios.get('https://api.imgur.com/3/gallery/t/dankmemes', {
      headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` },
    });

    const memes = imgurResponse.data.data.items.filter((item) => item.images);

    if (memes.length === 0) {
      console.log('No dank memes found on Imgur.');
      return null;
    }

    for (const meme of memes) {
      const imageUrl = meme.images[0].link;
      const imageType = meme.images[0].type;


      if (imageType.startsWith('image/') && !(await isPostProcessedOrRejected(meme.id, 'Imgur'))) {
        console.log(`Fetched Imgur meme: ${meme.title}`);
        return { postId: meme.id, title: meme.title, mediaUrl: imageUrl };
      } else if (await isPostProcessedOrRejected(meme.id, 'Imgur')) {
        console.log(`Skipping meme ${meme.id} as it has already been processed or rejected.`);
      } else {
        console.log(`Skipping meme ${meme.id} due to unsupported media type: ${imageType}`);
        await saveRejectedPost(meme.id, 'Imgur', 'Unsupported media type');
      }
    }

    console.log('All Imgur memes have been posted or rejected.');
    return null;
  } catch (error) {
    console.log('Error fetching Imgur memes:', error.message);
    return null;
  }
}



async function saveRejectedPost(postId, platform, reason) {
  try {
    const rejectedPost = new RejectedPost({ postId, platform, reason, addedAt: new Date() });
    await rejectedPost.save();
    console.log(`Rejected post: ${postId} from ${platform} due to ${reason}`);
  } catch (error) {
    console.log(`Error saving rejected post ${postId} from ${platform}:`, error.message);
  }
}



async function postToInstagram(imageUrl, title, platform, tags = []) {

  const caption = title + "\nSource: " + platform + "\nTags: " + tags.join(' ');
  const accessToken = process.env.INSTAGRAM_SECRET;

  try {
   
    const mediaResponse = await axios.post(
      `https://graph.instagram.com/v17.0/me/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      }
    );

    const mediaId = mediaResponse.data.id;
    console.log('Media ID:', mediaId);

  
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v17.0/me/media_publish`,
      {
        creation_id: mediaId,
        access_token: accessToken
      }
    );

    console.log('Publish response:', publishResponse.data);
    console.log('Post published successfully!');
    return publishResponse.data
  } catch (error) {
    console.error('Error posting to Instagram:', error.response ? error.response.data : error.message);
    return false
  }
}

async function connectToDatabase() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  }
}


async function Xcronjob() {
  console.log('Cron Job: Fetching and posting top Reddit, Facebook, and Imgur memes...');

  try {
  
    await connectToDatabase();

    const redditPosts = await fetchRedditPosts();
    const facebookPosts = await fetchFacebookPosts();
    const imgurMeme = await fetchImgurMeme();

    const tags = ['#dankmemes','#memes','#meme','#memesdaily','#funnymemes','#funny',' #offensivememes','#instagram',' #funnyshit'];
    const results = [];


    for (const post of redditPosts) {
      const result = await postToInstagram(post.mediaUrl, post.title, `r/${post.subreddit}`, tags);
      if (result) {
        const newPost = new RedditPost({ subreddit: post.subreddit, postId: post.postId, mediaUrl: post.mediaUrl, addedAt: new Date() });
        await newPost.save();
      }
      results.push(result);
    }


    for (const post of facebookPosts) {
      const result = await postToInstagram(post.mediaUrl, post.message || 'Check out this post!', 'Facebook', tags);
      if (result) {
        const newPost = new FacebookPost({ postId: post.postId, message: post.message, mediaUrl: post.mediaUrl, addedAt: new Date() });
        await newPost.save();
      }
      results.push(result);
    }


    if (imgurMeme) {
      const result = await postToInstagram(imgurMeme.mediaUrl, imgurMeme.title, 'Imgur', tags);
      if (result) {
        const newPost = new ImgurPost({ postId: imgurMeme.postId, title: imgurMeme.title, mediaUrl: imgurMeme.mediaUrl, addedAt: new Date() });
        await newPost.save();
      }
      results.push(result);
    }

    return results; 
  } catch (error) {
    console.error('Error in cron job:', error.message);
    throw new Error(error.message); 
  }
}


exports.Xcronjob = Xcronjob;

router.get('/test-fetch-post', async (req, res) => {
  console.log('Manual test: Fetching and posting top Reddit, Facebook, and Imgur memes...');

  try {
    const redditPosts = await fetchRedditPosts();
    const facebookPosts = await fetchFacebookPosts();
    const imgurMeme = await fetchImgurMeme();

    const tags = ['#dankmemes','#memes','#meme','#memesdaily','#funnymemes','#funny',' #offensivememes','#instagram',' #funnyshit'];
    const results = [];


    for (const post of redditPosts) {
      const result = await postToInstagram(post.mediaUrl, post.title, `r/${post.subreddit}`, tags);
      if (result) {
        const newPost = new RedditPost({ subreddit: post.subreddit, postId: post.postId, mediaUrl: post.mediaUrl, addedAt: new Date() });
        await newPost.save();
      }
      results.push(result);
    }


    for (const post of facebookPosts) {
      const result = await postToInstagram(post.mediaUrl, post.message, 'Facebook', tags);
      if (result) {
        const newPost = new FacebookPost({ postId: post.postId, message: post.message, mediaUrl: post.mediaUrl, addedAt: new Date() });
        await newPost.save();
      }
      results.push(result);
    }


    if (imgurMeme) {
      const result = await postToInstagram(imgurMeme.mediaUrl, imgurMeme.title, 'Imgur', tags);
      if (result) {
        const newPost = new ImgurPost({ postId: imgurMeme.postId, title: imgurMeme.title, mediaUrl: imgurMeme.mediaUrl, addedAt: new Date() });
        await newPost.save();
      }
      results.push(result);
    }

    res.status(200).json(results.filter(Boolean)); 
  } catch (error) {
    console.log('Error in test fetch and post:', error.message);
    res.status(500).json({ error: error.message });
  }
});




// // Cron job for daily post at 7 AM IST
// cron.schedule('30 1 * * *', async () => {
//   console.log('Cron job triggered: Fetching and posting top Reddit, Facebook, and Imgur memes...');

//   try {
//     const redditPosts = await fetchRedditPosts();
//     const facebookPosts = await fetchFacebookPosts();
//     const imgurMeme = await fetchImgurMeme();

//     const tags = ['Reddit', 'Facebook', 'Imgur', 'Trending'];

//     // Post Reddit content to Instagram
//     for (const post of redditPosts) {
//       const result = await postToInstagram(post.mediaUrl, post.title, `r/${post.subreddit}`, tags);
//       if (result) {
//         await saveRedditPost(post);
//       }
//     }

//     // Post Facebook content to Instagram
//     for (const post of facebookPosts) {
//       const result = await postToInstagram(post.mediaUrl, post.message || 'Check out this post!', 'Facebook', tags);
//       if (result) {
//         await saveFacebookPost(post);
//       }
//     }

//     // Post Imgur meme to Instagram
//     if (imgurMeme) {
//       const result = await postToInstagram(imgurMeme.mediaUrl, imgurMeme.title, 'Imgur', tags);
//       if (result) {
//         await saveImgurPost(imgurMeme);
//       }
//     }
//   } catch (error) {
//     console.log('Error in cron job:', error.message);
//   }
// }, {
//   timezone: 'Asia/Kolkata', // Set timezone to IST
// });


async function saveRedditPost(post) {
  try {
    const redditPost = new RedditPost({
      subreddit: post.subreddit,
      postId: post.postId,
      mediaUrl: post.mediaUrl,
      addedAt: new Date(),
    });
    await redditPost.save();
    console.log(`Saved Reddit post ${post.postId}`);
  } catch (error) {
    console.log('Error saving Reddit post:', error.message);
  }
}


async function saveFacebookPost(post) {
  try {
    const facebookPost = new FacebookPost({
      postId: post.postId,
      message: post.message,
      mediaUrl: post.mediaUrl,
      addedAt: new Date(),
    });
    await facebookPost.save();
    console.log(`Saved Facebook post ${post.postId}`);
  } catch (error) {
    console.log('Error saving Facebook post:', error.message);
  }
}


async function saveImgurPost(meme) {
  try {
    const imgurPost = new ImgurPost({
      postId: meme.postId,
      title: meme.title,
      mediaUrl: meme.mediaUrl,
      addedAt: new Date(),
    });
    await imgurPost.save();
    console.log(`Saved Imgur post ${meme.postId}`);
  } catch (error) {
    console.log('Error saving Imgur post:', error.message);
  }
}


let logData = [];

// Utility function to add a log entry and save it to a file
function addLogEntry(log) {
  logData.push(log);  // Add log to the array
  const logFilePath = path.join(__dirname, 'logs.json');
  
  // Write the logs to the logs.json file
  fs.writeFile(logFilePath, JSON.stringify(logData, null, 2), (err) => {
    if (err) {
      console.error('Error writing log file:', err);
    } else {
      console.log('Log file updated successfully.');
    }
  });
}


function logError(message) {
  const logEntry = {
    message: message,
    timestamp: new Date().toISOString()
  };
  addLogEntry(logEntry);
}


router.get('/logs', async (req, res) => {
  try {
    // Read the logs.json file and send it to the frontend
    const logFilePath = path.join(__dirname, 'logs.json');
    fs.readFile(logFilePath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading log file:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(JSON.parse(data));  // Send logs to frontend
      }
    });
  } catch (error) {
    console.log('Error fetching logs:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/posts', async (req, res) => {
  try {
    const redditPosts = await RedditPost.find().sort({ addedAt: -1 });
    const facebookPosts = await FacebookPost.find().sort({ addedAt: -1 });
    const imgurPosts = await ImgurPost.find().sort({ addedAt: -1 });
    
    const posts = [...redditPosts, ...facebookPosts, ...imgurPosts];
    res.json(posts);
  } catch (error) {
    console.log('Error fetching posts:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/rejected-posts', async (req, res) => {
  try {
    const rejectedPosts = await RejectedPost.find().sort({ addedAt: -1 });
    res.json(rejectedPosts);
  } catch (error) {
    console.log('Error fetching rejected posts:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// // Fetch Instagram insights for a given post
// app.get('/instagram-insights/:postId', async (req, res) => {
//   const { postId } = req.params;
//   try {
//     const insightsResponse = await axios.get(`https://graph.instagram.com/${postId}/insights`, {
//       params: {
//         metric: 'engagement,impressions,reach,likes,comments,shares',
//         access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
//       },
//     });

//     const insights = insightsResponse.data.data.reduce((acc, insight) => {
//       acc[insight.name] = insight.values[0].value;
//       return acc;
//     }, {});

//     res.json(insights);
//   } catch (error) {
//     console.log('Error fetching Instagram insights:', error.message);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.use('api/cronjob', router);

module.exports.handler = serverless(app)