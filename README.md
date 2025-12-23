# Follow-Up Automation System v2.0

A comprehensive dashboard and API for managing sales/CS follow-ups with Google Sheets integration, authentication, and WhatsApp reminders.

## 🚀 Features

### Core Features
- 🔐 **Secure Login** - JWT-based authentication for sales agents
- 👤 **Agent-Specific Views** - Each agent sees only their assigned leads
- 📊 **Real-Time Dashboard** - Auto-refreshing lead cards with 30s polling
- 📱 **WhatsApp Reminders** - Schedule reminders directly from dashboard
- 📋 **Follow-Up Management** - Complete task management with filters
- ✅ **Status Tracking** - Today, Upcoming, Overdue, Completed
- 🔔 **Desktop Notifications** - Get notified when new leads arrive
- 🎨 **Modern UI** - Clean, responsive Tailwind design

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS

**Backend:**
- Node.js
- Express
- Google Sheets API

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Sheets API enabled
- Google Service Account credentials

## 🔧 Setup

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

**Note:** The system now includes authentication. See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for details.

```env
PORT=5000
NODE_ENV=development
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
JWT_SECRET=your-secret-key-change-in-production
```

**Google Sheets Setup:**
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Download the JSON key file
5. Share your Google Sheet with the service account email
6. Copy the Sheet ID from the URL
7. Paste the entire JSON content as `GOOGLE_SERVICE_ACCOUNT_JSON`

### 3. Google Sheet Structure

Your sheet should have these columns:
- Lead Name
- Phone Number
- Assigned Agent
- Follow-Up Date (YYYY-MM-DD)
- Follow-Up Time (HH:MM)
- Follow-Up Mode (Call / WhatsApp)
- Completed (Yes / No)
- Last Updated

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### First Login

Default demo accounts:
- Username: `agent.smith` / Password: `password123`
- Username: `agent.jones` / Password: `password123`
- Username: `admin` / Password: `password123`

See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for more details.

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
follow-up-automation/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── contexts/      # React contexts
│   └── package.json
├── server/                # Backend Express app
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utilities
│   │   └── server.js     # Entry point
│   └── package.json
└── package.json          # Root package.json
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Leads
- `GET /api/leads` - Get leads for logged-in agent
- `GET /api/leads/new?since=timestamp` - Get new leads (real-time)
- `POST /api/follow-up/update` - Update follow-up details
- `POST /api/follow-up/complete` - Mark follow-up as complete

### Reminders
- `POST /api/reminders` - Create WhatsApp reminder
- `GET /api/reminders` - Get agent's reminders
- `DELETE /api/reminders/:id` - Cancel reminder

**All endpoints (except login) require JWT authentication.**

## 🚢 Deployment (Render)

1. Connect your repository to Render
2. Create a Web Service
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard

## 📝 Status Logic

- **Today**: Follow-up date is today AND not completed
- **Upcoming**: Follow-up date is in the future
- **Overdue**: Follow-up date has passed AND not completed
- **Completed**: Marked as completed

## 🔐 Access Control

- **Login Required**: All users must authenticate
- **Agent Filtering**: Agents see only their assigned leads
- **JWT Tokens**: 24-hour session expiry
- **Secure Routes**: All API endpoints protected

See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for complete details.

## 🎯 What's New in v2.0

✅ **Authentication System** - Secure JWT-based login  
✅ **Real-Time Dashboard** - Auto-refreshing lead cards  
✅ **WhatsApp Reminders** - Schedule reminders for leads  
✅ **Desktop Notifications** - Get alerted for new leads  
✅ **Agent-Specific Views** - See only your leads  
✅ **Dual Dashboard** - Real-time + Follow-up management  

## 🎯 Future Enhancements

- WhatsApp Business API integration (actual sending)
- Persistent database (PostgreSQL/MongoDB)
- Two-factor authentication
- Advanced analytics dashboard
- Multi-sheet support
- Mobile app

## 📚 Documentation

- [README.md](./README.md) - This file (overview)
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - **NEW** Authentication & features guide
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute quick start
- [SETUP.md](./SETUP.md) - Detailed setup instructions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Technical overview

## 📄 License

MIT

