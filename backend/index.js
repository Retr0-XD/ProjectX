

const express = require('express');


const env = require('dotenv').config();

const app = express();


console.log(process.env.CLIENT_ID)


app.get('/', (req,res)=>{


    res.send("Hello, World!"+ process.env.HELLO);
    
});


app.listen(3000, () => console.log('Server started on port 3000'));