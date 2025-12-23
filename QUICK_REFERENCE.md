# Quick Reference Card

## 🚀 Quick Start

```bash
# Install
npm run install:all

# Start
npm run dev

# Login
http://localhost:5173
Username: agent.smith
Password: password123
```

---

## 🔐 Demo Accounts

| Username | Password | Agent Name |
|----------|----------|------------|
| agent.smith | password123 | Agent Smith |
| agent.jones | password123 | Agent Jones |
| admin | password123 | Admin User |

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/login          Login
GET    /api/auth/me             Get current user
POST   /api/auth/logout         Logout
```

### Leads
```
GET    /api/leads               Get my leads
GET    /api/leads/new           Get new leads (real-time)
POST   /api/follow-up/update    Update follow-up
POST   /api/follow-up/complete  Mark complete
```

### Reminders
```
POST   /api/reminders           Create reminder
GET    /api/reminders           Get my reminders
DELETE /api/reminders/:id       Cancel reminder
```

**All require:** `Authorization: Bearer {token}`

---

## 📊 Dashboard Tabs

### Real-Time Dashboard
- Auto-refreshes every 30s
- Card-based layout
- Set WhatsApp reminders
- Desktop notifications

### Follow-Ups Management
- Table-based layout
- Filter by status
- Edit details
- Mark complete

---

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| Overdue | 🔴 Red | Past due, needs attention |
| Today | 🔵 Blue | Due today |
| Upcoming | 🟢 Green | Future follow-up |
| Completed | ⚪ Gray | Done |

---

## ⚙️ Environment Variables

```env
# Required
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key

# Google Sheets
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_JSON={...}
```

---

## 📱 WhatsApp Reminder

1. Click "Set WhatsApp Reminder" on lead
2. Customize message
3. Set schedule time
4. Click "Schedule Reminder"

**Default message:**
```
Hi [Name], this is a follow-up reminder 
regarding our discussion.
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start both frontend + backend
npm run dev:client       # Frontend only
npm run dev:server       # Backend only

# Production
npm run build            # Build both
npm start                # Start production server

# Install
npm run install:all      # Install all dependencies
```

---

## 📁 Project Structure

```
follow-up-automation/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Login, Dashboard
│   │   ├── lib/         # API, Auth
│   │   └── hooks/       # Custom hooks
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── middleware/  # Auth middleware
│   └── package.json
└── package.json         # Root scripts
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't login | Use `agent.smith` / `password123` |
| No leads | Check "Assigned Agent" in sheet |
| Session expired | Login again (24h limit) |
| No notifications | Allow in browser settings |
| Port in use | Change PORT in server/.env |

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| WHATS_NEW.md | **Start here** - New features overview |
| AUTHENTICATION_GUIDE.md | Complete auth guide |
| README.md | Main documentation |
| QUICKSTART.md | 5-minute guide |
| SETUP.md | Detailed setup |
| DEPLOYMENT.md | Production deployment |
| CHANGELOG.md | Version history |

---

## 🎯 Key Features

✅ Secure JWT authentication  
✅ Real-time lead monitoring  
✅ WhatsApp reminders  
✅ Desktop notifications  
✅ Agent-specific views  
✅ Auto-refresh (30s)  
✅ Dual dashboard  
✅ Google Sheets sync  

---

## 🔒 Security Notes

- Passwords hashed with bcrypt
- JWT tokens (24h expiry)
- All routes protected
- Change JWT_SECRET in production
- Use HTTPS in production

---

## 📞 Support

1. Check documentation files
2. Review troubleshooting sections
3. Test with demo accounts
4. Verify environment variables

---

**Version:** 2.0.0  
**Last Updated:** December 2024

