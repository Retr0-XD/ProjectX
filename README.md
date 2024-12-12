# ProjectX
Updated Deployment Instructions
Clone the Repository

bash
Copy code
git clone https://github.com/Retr0-XD/ProjectX.git
cd ProjectX
Install Dependencies
Ensure you have Node.js installed, then run:

bash
Copy code
npm install
Set Up Environment Variables
Create a .env file in the root directory and copy the contents of .env.example. Replace placeholders (<...>) with actual credentials.

Run the Application Locally
To start the application locally:

bash
Copy code
npm run start
Deploy to Vercel

Install the Vercel CLI if not already installed:
bash
Copy code
npm install -g vercel
Link the project to Vercel:
bash
Copy code
vercel
Deploy the project:
bash
Copy code
vercel deploy
Configure Environment Variables on Vercel

Go to your project in the Vercel Dashboard.
Navigate to Settings > Environment Variables.
Add the same variables from .env with their values for each service:
MongoDB
Reddit
Twitter
Facebook
Imgur
Monitor Deployment
Check logs and monitor the application using the Vercel Dashboard.






