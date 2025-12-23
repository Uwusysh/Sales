# Quick Start Guide

Get the Follow-Up Automation system running in 5 minutes!

## 🚀 Fast Setup (Using Mock Data)

Want to see the app in action immediately? Follow these steps:

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Open Browser

Navigate to: `http://localhost:5173`

**That's it!** The app will run with mock data so you can explore the interface immediately.

## 📊 Connect to Your Google Sheet

Once you're ready to connect real data:

### Step 1: Create Google Sheet

Create a new Google Sheet with these columns:

| Lead Name | Phone Number | Assigned Agent | Follow-Up Date | Follow-Up Time | Follow-Up Mode | Completed | Last Updated |
|-----------|--------------|----------------|----------------|----------------|----------------|-----------|--------------|

### Step 2: Get Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable **Google Sheets API**
4. Create **Service Account** credentials
5. Download the JSON key file
6. Share your Google Sheet with the service account email

[Detailed instructions in SETUP.md](./SETUP.md)

### Step 3: Configure Environment

1. Create `server/.env` file:

```env
PORT=5000
NODE_ENV=development
GOOGLE_SHEET_ID=your_sheet_id_from_url
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...paste entire json...}
```

2. Restart the server:

```bash
npm run dev
```

## 📝 Add Sample Data

Add test leads to your Google Sheet:

| Lead Name | Phone Number | Assigned Agent | Follow-Up Date | Follow-Up Time | Follow-Up Mode | Completed | Last Updated |
|-----------|--------------|----------------|----------------|----------------|----------------|-----------|--------------|
| John Doe | +1234567890 | Agent Smith | 2024-12-24 | 10:00 | Call | No | |
| Jane Smith | +1234567891 | Agent Smith | 2024-12-23 | 14:00 | WhatsApp | No | |

**Important:** 
- Date format: `YYYY-MM-DD`
- Time format: `HH:MM` (24-hour)
- Completed: `Yes` or `No`
- Assigned Agent must match the agent name in the dashboard

## 🎯 Using the Dashboard

### Filter Follow-Ups

Click the filter buttons at the top:
- **All** - View all leads
- **Today** - Follow-ups scheduled for today
- **Upcoming** - Future follow-ups
- **Overdue** - Past due follow-ups
- **Completed** - Finished follow-ups

### Edit Follow-Up Details

1. Click **Edit** on any lead
2. Change date, time, or mode
3. Click **Save**

### Mark as Complete

Check the **Done** checkbox to mark a follow-up as complete.

### Refresh Data

Click the **Refresh** button in the header to reload data from Google Sheets.

## 🏗️ Project Structure

```
follow-up-automation/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # API utilities
│   │   └── contexts/    # React contexts
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── server.js    # Entry point
│   └── package.json
└── package.json         # Root package.json
```

## 🧪 API Endpoints

Test the APIs directly:

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Get Leads
```bash
curl http://localhost:5000/api/leads?agent=Agent%20Smith
```

### Update Follow-Up
```bash
curl -X POST http://localhost:5000/api/follow-up/update \
  -H "Content-Type: application/json" \
  -d '{"rowIndex": 2, "followUpDate": "2024-12-25", "followUpTime": "15:00"}'
```

### Complete Follow-Up
```bash
curl -X POST http://localhost:5000/api/follow-up/complete \
  -H "Content-Type: application/json" \
  -d '{"rowIndex": 2, "completed": true}'
```

## 🚢 Deploy to Production

Ready to deploy? Check out:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guides
- [render.yaml](./render.yaml) - One-click Render deployment

### Quick Deploy to Render

1. Push code to GitHub
2. Connect to Render
3. Add environment variables
4. Deploy!

[Full instructions in DEPLOYMENT.md](./DEPLOYMENT.md)

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Change port in server/.env
PORT=5001
```

### Can't Connect to Google Sheets

- Check service account email has access to sheet
- Verify `GOOGLE_SHEET_ID` is correct
- Ensure JSON credentials are valid

### Mock Data Still Showing

The app shows mock data when:
- No `.env` file in `server/` directory
- Invalid Google Sheets credentials
- Google Sheets API not enabled

This is intentional so you can explore the interface immediately!

## 📚 Next Steps

1. ✅ Run the app with mock data
2. ✅ Configure Google Sheets integration
3. ✅ Add real lead data
4. ✅ Test all features
5. ✅ Deploy to production
6. 🎉 Start automating follow-ups!

## 💡 Tips

- **Agent Name**: Default is "Agent Smith" - change it in the code or add agent selection dropdown
- **Time Zones**: All times are local to the server
- **Data Refresh**: Data auto-refreshes after each action, or click Refresh button
- **Excel Format**: You can import/export leads using Google Sheets' Excel support

## 🔗 Useful Links

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [README](./README.md) - Full documentation

---

**Need Help?** Check the documentation or open an issue!

