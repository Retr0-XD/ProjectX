// const Snoowrap = require('snoowrap');
// require('dotenv').config()

// const r = new Snoowrap({
//     userAgent: 'ProjectX/1.0.0 Retr0',
//     clientId: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     username: process.env.REDDIT_USERNAME,
//     password: process.env.REDDIT_PASSWORD
//   });
  

//   module.exports = r;

// reddit.js
const Snoowrap = require('snoowrap');
require('dotenv').config();

const r = new Snoowrap({
  userAgent: 'ProjectX/1.0.0 Retr0',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
});

// async function fetchRedditPosts() {
//   try {
//     console.log("Fetching subscribed subreddits...");

//     const subreddits = await r.getSubscriptions({ limit: 10 });
//     console.log(`Subscribed subreddits: ${subreddits.map(s => s.display_name).join(', ')}`);

//     const postsToConsider = [];

//     for (const subreddit of subreddits) {
//       console.log(`Fetching top posts for subreddit: ${subreddit.display_name}`);

//       const topPosts = await r.getSubreddit(subreddit.display_name).getTop({ time: 'day', limit: 5 });

//       for (const post of topPosts) {
//         postsToConsider.push({
//           subreddit: subreddit.display_name,
//           postId: post.id,
//           title: post.title,
//           imageUrl: post.url,
//           upvotes: post.ups,
//         });
//         console.log(`Post found: ${post.title} with ${post.ups} upvotes.`);
//       }
//     }

//     postsToConsider.sort((a, b) => b.upvotes - a.upvotes);

//     console.log(`Total posts fetched: ${postsToConsider.length}`);
//     return postsToConsider;
//   } catch (error) {
//     console.error('Error fetching Reddit posts:', error);
//   }
// }

async function fetchRedditPosts() {
  try {
    console.log("Fetching subscribed subreddits...");

    const subreddits = await r.getSubscriptions({ limit: 10 });
    console.log(`Subscribed subreddits: ${subreddits.map(s => s.display_name).join(', ')}`);

    const postsToConsider = [];

    for (const subreddit of subreddits) {
      console.log(`Fetching top posts for subreddit: ${subreddit.display_name}`);

      const topPosts = await r.getSubreddit(subreddit.display_name).getTop({ time: 'day', limit: 5 });

      for (const post of topPosts) {
        const isVideo = post.is_video;
        const mediaUrl = isVideo ? post.media.reddit_video.fallback_url : post.url; // Get video URL if it's a video

        postsToConsider.push({
          subreddit: subreddit.display_name,
          postId: post.id,
          title: post.title,
          mediaUrl: mediaUrl,
          isVideo: isVideo,
          upvotes: post.ups,
        });
        console.log(`Post found: ${post.title} with ${post.ups} upvotes.`);
      }
    }

    postsToConsider.sort((a, b) => b.upvotes - a.upvotes);

    console.log(`Total posts fetched: ${postsToConsider.length}`);
    return postsToConsider;
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
  }
}


async function fetchTrendingPosts() {
  try {
    console.log("Fetching trending posts from /r/popular...");
    const topPosts = await r.getSubreddit('popular').getTop({ time: 'day', limit: 5 });
    
    return topPosts.map(post => ({
      subreddit: post.subreddit_name_prefixed,
      postId: post.id,
      title: post.title,
      imageUrl: post.url,
      upvotes: post.ups,
    }));
  } catch (error) {
    console.error('Error fetching trending posts:', error);
  }
}

module.exports = { fetchRedditPosts, fetchTrendingPosts };
