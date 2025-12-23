# Setup Guide

This guide will help you set up the Follow-Up Automation system from scratch.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Google account with access to Google Cloud Console

## Step 1: Clone and Install

```bash
# Navigate to the project directory
cd follow-up-automation

# Install all dependencies
npm run install:all
```

## Step 2: Google Sheets Setup

### 2.1 Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it (e.g., "Sales Follow-Ups")
4. Add the following headers in the first row:

| Lead Name | Phone Number | Assigned Agent | Follow-Up Date | Follow-Up Time | Follow-Up Mode | Completed | Last Updated |
|-----------|--------------|----------------|----------------|----------------|----------------|-----------|--------------|

5. Copy the Sheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
   - Copy the `YOUR_SHEET_ID` part

### 2.2 Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and click "Create"
   - Skip optional steps and click "Done"
5. Create and Download Key:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Select "JSON" format
   - Click "Create" (file will download)

### 2.3 Share Sheet with Service Account

1. Open the downloaded JSON key file
2. Find the `client_email` field (looks like: `xxxxx@xxxxx.iam.gserviceaccount.com`)
3. Copy this email
4. Go back to your Google Sheet
5. Click "Share" button
6. Paste the service account email
7. Give it "Editor" access
8. Uncheck "Notify people"
9. Click "Share"

## Step 3: Configure Environment Variables

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file:
   ```env
   PORT=5000
   NODE_ENV=development
   GOOGLE_SHEET_ID=paste_your_sheet_id_here
   GOOGLE_SERVICE_ACCOUNT_JSON=paste_entire_json_content_here
   ```

4. For `GOOGLE_SERVICE_ACCOUNT_JSON`:
   - Open the downloaded JSON key file
   - Copy the ENTIRE content (it should start with `{` and end with `}`)
   - Paste it as a single line (or multiline is fine in .env)

## Step 4: Test the Setup

1. Add some sample data to your Google Sheet:
   - Lead Name: "Test Lead"
   - Phone Number: "+1234567890"
   - Assigned Agent: "Agent Smith"
   - Follow-Up Date: Today's date (YYYY-MM-DD format)
   - Follow-Up Time: "10:00"
   - Follow-Up Mode: "Call"
   - Completed: "No"
   - Last Updated: (leave empty)

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

4. You should see your test lead in the dashboard!

## Step 5: Deployment to Render

### 5.1 Prepare Repository

1. Initialize git (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Push to GitHub/GitLab/Bitbucket

### 5.2 Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" > "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: follow-up-automation
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or as needed)

5. Add Environment Variables:
   - Click "Advanced" > "Add Environment Variable"
   - Add:
     - `NODE_ENV` = `production`
     - `PORT` = `10000` (or leave default)
     - `GOOGLE_SHEET_ID` = Your sheet ID
     - `GOOGLE_SERVICE_ACCOUNT_JSON` = Your full JSON content

6. Click "Create Web Service"

7. Wait for deployment to complete

8. Access your app at the provided URL!

## Troubleshooting

### Issue: "Failed to fetch leads"

**Solution:**
- Check if service account email has access to the sheet
- Verify `GOOGLE_SHEET_ID` is correct
- Ensure `GOOGLE_SERVICE_ACCOUNT_JSON` is valid JSON

### Issue: "Mock data showing"

**Solution:**
- This means the app couldn't connect to Google Sheets
- Check environment variables are set correctly
- Verify Google Sheets API is enabled in Google Cloud Console

### Issue: Build fails on Render

**Solution:**
- Check build logs for specific errors
- Ensure all environment variables are set
- Verify `package.json` scripts are correct

## Need Help?

Check the main README.md for additional information or open an issue on GitHub.

