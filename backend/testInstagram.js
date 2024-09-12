const axios = require('axios');
require('dotenv').config();

// Test values (replace with actual data)
const imageUrl = 'https://i.redd.it/cr7np1o0ifnd1.png'; // Replace with a valid image URL
const caption = 'Test caption for Instagram post';
const accessToken = process.env.INSTAGRAM_SECRET; // Or replace with your Instagram access token

async function postToInstagram(imageUrl, caption) {
  try {
    // Step 1: Create a media object (photo container) in Instagram
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

    // Step 2: Publish the media object
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v17.0/me/media_publish`, 
      {
        creation_id: mediaId,
        access_token: accessToken
      }
    );

    console.log('Publish response:', publishResponse.data);
    console.log('Post published successfully!');

  } catch (error) {
    console.error('Error posting to Instagram:', error.response ? error.response.data : error.message);
  }
}

// Run the function
postToInstagram(imageUrl, caption);
