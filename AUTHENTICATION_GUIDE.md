# Authentication & New Features Guide

This guide covers the new authentication system, real-time dashboard, and WhatsApp reminder features added to the Follow-Up Automation MVP.

## 🔐 Authentication System

### Overview

The system now includes JWT-based authentication where:
- Sales agents must log in to access the dashboard
- Each agent sees only their assigned leads
- Sessions are secure with token-based authentication
- Automatic logout on session expiry

### Default User Accounts

Three demo accounts are pre-configured:

| Username | Password | Agent Name | Role |
|----------|----------|------------|------|
| `agent.smith` | `password123` | Agent Smith | agent |
| `agent.jones` | `password123` | Agent Jones | agent |
| `admin` | `password123` | Admin User | admin |

### Login Flow

1. User visits the application
2. Redirected to `/login` if not authenticated
3. Enter username and password
4. On success, JWT token is stored in localStorage
5. User is redirected to `/dashboard`
6. Token is included in all API requests

### API Authentication

All API endpoints (except `/api/auth/login`) now require authentication:

```typescript
// Example authenticated request
const response = await fetch('/api/leads', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Session Management

- **Token Expiry**: 24 hours
- **Auto-Logout**: On token expiration or invalid token
- **Manual Logout**: Click "Logout" button in header
- **Token Storage**: localStorage (client-side)

### Security Features

✅ Password hashing with bcrypt  
✅ JWT token signing  
✅ Token verification middleware  
✅ Automatic session expiry  
✅ Secure password storage  
✅ Protected API routes  

---

## 📊 Real-Time Dashboard

### Overview

A new "Real-Time Dashboard" tab shows leads as they come in from Google Sheets with:
- Auto-refresh every 30 seconds
- Visual lead cards with status
- Quick WhatsApp reminder setup
- Desktop notifications for new leads
- Live status indicators

### Features

#### 1. **Auto-Refresh**
- Polls Google Sheets every 30 seconds
- Shows new leads automatically
- Green pulse indicator shows active polling
- No manual refresh needed

#### 2. **Lead Cards**
Each lead is displayed as a card showing:
- Lead name and phone number
- Follow-up date and time
- Follow-up mode (Call/WhatsApp)
- Status badge (Today/Upcoming/Overdue)
- Quick action button for WhatsApp reminder

#### 3. **Visual Indicators**
- **Red border**: Overdue leads
- **Blue border**: Today's leads
- **White background**: Upcoming leads
- **Status badges**: Color-coded status

#### 4. **Desktop Notifications**
When new leads arrive:
- Browser notification appears
- Shows count of new leads
- Requires notification permission (requested on first load)

### Usage

1. Navigate to dashboard
2. Click "Real-Time Dashboard" tab
3. New leads appear automatically
4. Click "Set WhatsApp Reminder" on any lead
5. Configure and schedule reminder

---

## 📱 WhatsApp Reminder System

### Overview

Agents can schedule WhatsApp reminders for any lead directly from the dashboard.

### Features

#### 1. **Quick Setup**
- Click "Set WhatsApp Reminder" button on any lead
- Modal opens with pre-filled information
- Customize message and schedule time
- Submit to schedule

#### 2. **Reminder Configuration**

**Default Message Template:**
```
Hi [Lead Name], this is a follow-up reminder regarding our discussion.
```

**Scheduling:**
- Date and time picker
- Default: 30 minutes from now
- Can schedule for future date/time
- ISO 8601 timestamp format

#### 3. **Reminder Storage**
Currently stored in-memory (for MVP). In production:
- Save to database
- Queue in job scheduler
- Integrate with WhatsApp Business API
- Track delivery status

### API Endpoints

#### Create Reminder
```http
POST /api/reminders
Authorization: Bearer {token}
Content-Type: application/json

{
  "leadRowIndex": 2,
  "phoneNumber": "+1234567890",
  "message": "Custom message here",
  "scheduledTime": "2024-12-24T15:30:00Z"
}
```

#### Get Reminders
```http
GET /api/reminders
Authorization: Bearer {token}
```

#### Delete Reminder
```http
DELETE /api/reminders/{id}
Authorization: Bearer {token}
```

### WhatsApp Integration (Production)

For production deployment, integrate with:

1. **WhatsApp Business API**
   - Official API from Meta
   - Requires business verification
   - Supports templates and media

2. **Third-Party Services**
   - Twilio WhatsApp API
   - MessageBird
   - Vonage

3. **Implementation Steps**
   - Get API credentials
   - Update `server/src/services/whatsappService.js`
   - Add job scheduler (Bull, Agenda)
   - Implement retry logic
   - Add delivery tracking

---

## 🏗️ Architecture Changes

### Backend Updates

#### New Files
```
server/src/
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Login/logout endpoints
│   └── reminders.js         # WhatsApp reminder endpoints
└── services/
    ├── userService.js       # User management
    └── (future) whatsappService.js
```

#### Updated Files
- `server.js` - Added auth routes, cookie parser
- `leads.js` - Added authentication middleware
- `followUp.js` - Added authentication middleware

#### New Dependencies
```json
{
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "cookie-parser": "^1.4.6"
}
```

### Frontend Updates

#### New Files
```
client/src/
├── lib/
│   └── auth.ts              # Auth service & token management
├── pages/
│   ├── Login.tsx            # Login page
│   └── NewLeadsDashboard.tsx # Real-time dashboard
├── components/
│   └── WhatsAppReminderModal.tsx # Reminder modal
└── hooks/
    └── useNavigate.ts       # Simple navigation hook
```

#### Updated Files
- `App.tsx` - Added routing and auth checks
- `AgentContext.tsx` - Added AuthProvider
- `api.ts` - Added auth headers to all requests
- `Dashboard.tsx` - Added tabs and new dashboard
- `Header.tsx` - Added logout button
- `useLeads.ts` - Removed agent parameter

---

## 🚀 Getting Started

### 1. Install New Dependencies

```bash
# Install all dependencies
npm run install:all
```

### 2. Start the Application

```bash
# Development mode
npm run dev
```

### 3. Login

1. Open http://localhost:5173
2. You'll be redirected to login page
3. Use any demo account:
   - Username: `agent.smith`
   - Password: `password123`

### 4. Explore Features

**Real-Time Dashboard:**
- Click "Real-Time Dashboard" tab
- See your leads in card format
- Click "Set WhatsApp Reminder" on any lead

**Follow-Ups Management:**
- Click "Follow-Ups Management" tab
- Use filters (Today, Upcoming, Overdue, Completed)
- Edit follow-up details
- Mark as complete

---

## 🔧 Configuration

### Environment Variables

Add to `server/.env`:

```env
# Existing variables
PORT=5000
NODE_ENV=development
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_JSON={...}

# New variables
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important:** Change `JWT_SECRET` in production!

### User Management

#### Add New Users

Edit `server/src/services/userService.js`:

```javascript
const defaultUsers = [
  {
    username: 'new.agent',
    password: '$2a$10$...', // Use bcrypt to hash
    agentName: 'New Agent',
    role: 'agent'
  }
]
```

#### Generate Password Hash

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('password123', 10);
console.log(hash);
```

---

## 📱 Browser Notifications

### Setup

1. Browser will request notification permission on first load
2. Click "Allow" to enable notifications
3. New leads will trigger desktop notifications

### Supported Browsers
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari (macOS)
- ❌ Mobile browsers (limited support)

---

## 🎯 Usage Scenarios

### Scenario 1: Agent Login & View Leads

1. Agent logs in with credentials
2. Sees only their assigned leads
3. Switches between dashboard views
4. Sets reminders for important leads

### Scenario 2: Real-Time Lead Monitoring

1. Agent opens Real-Time Dashboard
2. Leaves tab open
3. New leads appear automatically every 30 seconds
4. Desktop notification alerts agent
5. Agent clicks to set WhatsApp reminder

### Scenario 3: Follow-Up Management

1. Agent switches to Follow-Ups Management
2. Filters for "Today" tasks
3. Edits follow-up times
4. Marks completed tasks
5. Data syncs to Google Sheets

---

## 🔒 Security Best Practices

### For Development
- Use default credentials for testing
- JWT_SECRET can be simple
- HTTP is acceptable

### For Production
- ✅ Change all default passwords
- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Enable HTTPS
- ✅ Set secure cookie flags
- ✅ Implement rate limiting
- ✅ Add password requirements
- ✅ Enable 2FA (optional)
- ✅ Use environment secrets management

---

## 🐛 Troubleshooting

### Issue: "Session expired" error

**Solution:**
- Token expired (24h limit)
- Log in again
- Token will refresh

### Issue: Can't see any leads

**Solution:**
- Check Google Sheet has data
- Verify "Assigned Agent" matches your agent name
- Check Google Sheets credentials

### Issue: WhatsApp reminders not sending

**Solution:**
- This is expected in MVP
- Reminders are logged to console
- Implement WhatsApp API for production

### Issue: Desktop notifications not working

**Solution:**
- Check browser notification permission
- Some browsers block notifications
- Try different browser

---

## 🚢 Deployment Notes

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=your-very-long-random-secret-key-here
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_JSON={...}
```

### Render/Heroku Setup

1. Add all environment variables in dashboard
2. Ensure `JWT_SECRET` is set
3. Deploy as usual
4. Test login functionality

---

## 📈 Future Enhancements

### Phase 1 (Immediate)
- [ ] Persistent user database (PostgreSQL)
- [ ] Password reset functionality
- [ ] Remember me option
- [ ] Session timeout warning

### Phase 2 (Short-term)
- [ ] WhatsApp Business API integration
- [ ] Actual message sending
- [ ] Delivery status tracking
- [ ] Message templates

### Phase 3 (Long-term)
- [ ] Two-factor authentication
- [ ] Role-based permissions
- [ ] Admin user management panel
- [ ] Audit logs
- [ ] Advanced analytics

---

## 📚 API Reference

### Authentication Endpoints

#### POST /api/auth/login
Login with credentials

**Request:**
```json
{
  "username": "agent.smith",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "agent.smith",
      "agentName": "Agent Smith",
      "role": "agent"
    }
  }
}
```

#### GET /api/auth/me
Get current user info

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "agent.smith",
    "agentName": "Agent Smith",
    "role": "agent"
  }
}
```

#### POST /api/auth/logout
Logout current user

**Headers:**
```
Authorization: Bearer {token}
```

### Leads Endpoints

#### GET /api/leads
Get leads for logged-in agent

**Headers:**
```
Authorization: Bearer {token}
```

#### GET /api/leads/new?since={timestamp}
Get new leads since timestamp

**Headers:**
```
Authorization: Bearer {token}
```

### Reminder Endpoints

#### POST /api/reminders
Create WhatsApp reminder

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "leadRowIndex": 2,
  "phoneNumber": "+1234567890",
  "message": "Follow-up reminder",
  "scheduledTime": "2024-12-24T15:30:00Z"
}
```

---

## ✅ Testing Checklist

- [ ] Login with all demo accounts
- [ ] Verify agent-specific lead filtering
- [ ] Test auto-refresh on Real-Time Dashboard
- [ ] Create WhatsApp reminder
- [ ] Edit follow-up details
- [ ] Mark follow-up as complete
- [ ] Test logout functionality
- [ ] Verify session expiry handling
- [ ] Check desktop notifications
- [ ] Test on mobile devices

---

**Need Help?** Check the main documentation or open an issue!

