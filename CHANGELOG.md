# Changelog

All notable changes to the Follow-Up Automation System.

## [2.0.0] - 2024-12-23

### 🎉 Major Release - Authentication & Real-Time Features

### Added

#### Authentication System
- ✅ JWT-based authentication with 24-hour tokens
- ✅ Secure login page with modern UI
- ✅ Three pre-configured demo accounts
- ✅ Password hashing with bcryptjs
- ✅ Protected API routes with middleware
- ✅ Automatic session expiry handling
- ✅ Logout functionality
- ✅ Token storage in localStorage

#### Real-Time Dashboard
- ✅ New "Real-Time Dashboard" tab
- ✅ Auto-refresh every 30 seconds
- ✅ Lead cards with visual status indicators
- ✅ Desktop notifications for new leads
- ✅ Live polling indicator
- ✅ `/api/leads/new` endpoint for incremental updates
- ✅ Notification permission request

#### WhatsApp Reminder System
- ✅ "Set WhatsApp Reminder" button on each lead
- ✅ Modal for configuring reminders
- ✅ Customizable message templates
- ✅ Date/time picker for scheduling
- ✅ `/api/reminders` endpoints (POST, GET, DELETE)
- ✅ In-memory reminder storage (MVP)
- ✅ Agent-specific reminder filtering

#### UI/UX Improvements
- ✅ Dual-tab interface (Real-Time + Follow-Ups)
- ✅ Logout button in header
- ✅ Enhanced login page with demo credentials
- ✅ Loading states for authentication
- ✅ Error handling for expired sessions
- ✅ Responsive modal design

### Changed

#### Backend
- 🔄 All API endpoints now require authentication
- 🔄 `GET /api/leads` no longer accepts agent query param (uses JWT)
- 🔄 Added authentication middleware to all routes
- 🔄 Enhanced error handling for 401 responses

#### Frontend
- 🔄 App now has routing logic (login vs dashboard)
- 🔄 API client includes auth headers automatically
- 🔄 `useLeads` hook simplified (no agent parameter)
- 🔄 Dashboard split into two views
- 🔄 Header includes logout button

#### Dependencies
- ➕ Added `jsonwebtoken` (^9.0.2)
- ➕ Added `bcryptjs` (^2.4.3)
- ➕ Added `cookie-parser` (^1.4.6)

### Security
- 🔒 All passwords hashed with bcrypt (10 rounds)
- 🔒 JWT tokens signed and verified
- 🔒 Protected routes with middleware
- 🔒 Automatic token expiry (24h)
- 🔒 Secure session management

### Documentation
- 📖 Added `AUTHENTICATION_GUIDE.md` - Complete auth & features guide
- 📖 Updated `README.md` - New features and API endpoints
- 📖 Added `CHANGELOG.md` - This file
- 📖 Updated `PROJECT_OVERVIEW.md` - Architecture changes

### Files Added

**Backend:**
```
server/src/
├── middleware/auth.js
├── routes/auth.js
├── routes/reminders.js
└── services/userService.js
```

**Frontend:**
```
client/src/
├── lib/auth.ts
├── pages/Login.tsx
├── pages/NewLeadsDashboard.tsx
├── components/WhatsAppReminderModal.tsx
└── hooks/useNavigate.ts
```

**Documentation:**
```
AUTHENTICATION_GUIDE.md
CHANGELOG.md
```

### Migration Notes

#### For Existing Users

1. **Install new dependencies:**
   ```bash
   npm run install:all
   ```

2. **Add JWT_SECRET to server/.env:**
   ```env
   JWT_SECRET=your-secret-key-here
   ```

3. **Login required:**
   - Use demo accounts: `agent.smith` / `password123`
   - Or add custom users in `userService.js`

4. **API changes:**
   - All requests now need `Authorization: Bearer {token}` header
   - Agent filtering automatic based on logged-in user

#### Breaking Changes

⚠️ **API Authentication Required**
- All endpoints (except `/api/auth/login`) now require JWT token
- Update any external integrations to include auth header

⚠️ **Agent Parameter Removed**
- `GET /api/leads?agent=Name` → `GET /api/leads`
- Agent determined from JWT token

### Known Issues

- Reminders stored in-memory (will reset on server restart)
- No password reset functionality yet
- Desktop notifications may not work on all browsers
- Mobile notification support limited

### Future Roadmap

**Phase 1 (Next Release):**
- [ ] Persistent user database
- [ ] Password reset via email
- [ ] Remember me functionality
- [ ] Session timeout warnings

**Phase 2:**
- [ ] WhatsApp Business API integration
- [ ] Actual message sending
- [ ] Delivery tracking
- [ ] Message templates library

**Phase 3:**
- [ ] Two-factor authentication
- [ ] Admin user management panel
- [ ] Role-based permissions
- [ ] Audit logs

---

## [1.0.0] - 2024-12-23

### Initial Release

#### Features
- ✅ Google Sheets integration
- ✅ Lead management dashboard
- ✅ Follow-up tracking
- ✅ Status filters (Today, Upcoming, Overdue, Completed)
- ✅ Edit follow-up details
- ✅ Mark tasks complete
- ✅ Mock data mode
- ✅ Responsive UI with Tailwind CSS
- ✅ React + Vite + TypeScript frontend
- ✅ Express + Node.js backend
- ✅ Deployment ready (Render, Heroku, etc.)

#### Documentation
- 📖 README.md
- 📖 QUICKSTART.md
- 📖 SETUP.md
- 📖 DEPLOYMENT.md
- 📖 PROJECT_OVERVIEW.md

---

## Version Format

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backward compatible)
- **PATCH** version for bug fixes (backward compatible)

## Legend

- ✅ Added
- 🔄 Changed
- 🐛 Fixed
- 🗑️ Removed
- 🔒 Security
- 📖 Documentation
- ⚠️ Breaking Change
- ➕ Dependency Added
- ➖ Dependency Removed

