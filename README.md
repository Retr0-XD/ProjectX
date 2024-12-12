# ProjectX

### Updated Deployment Instructions

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/Retr0-XD/ProjectX.git
   cd ProjectX
   ```

2. **Install Dependencies**  
   Ensure you have Node.js installed, then run:  
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**  
   Create a `.env` file in the root directory and copy the contents of `.env.example`. Replace placeholders (`<...>`) with actual credentials.

4. **Run the Application Locally**  
   To start the application locally:  
   ```bash
   npm run start
   ```

5. **Deploy to Vercel**  
   - Install the Vercel CLI if not already installed:  
     ```bash
     npm install -g vercel
     ```
   - Link the project to Vercel:  
     ```bash
     vercel
     ```
   - Deploy the project:  
     ```bash
     vercel deploy
     ```

6. **Configure Environment Variables on Vercel**  
   - Go to your project in the Vercel Dashboard.  
   - Navigate to **Settings > Environment Variables**.  
   - Add the same variables from `.env` with their values for each service:
     - MongoDB
     - Reddit
     - Twitter
     - Facebook
     - Imgur

7. **Monitor Deployment**  
   Check logs and monitor the application using the Vercel Dashboard.
