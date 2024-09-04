

const dotenv = require('dotenv').config({ path: __dirname + '/../.env' });

const snoowrap = require('snoowrap');


//console.log(process.env.REFRESH_TOKEN,__dirname )



const reddit = new snoowrap({
    userAgent: userAgent,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN
});


reddit.getHot().map(post => console.log(post.title))

