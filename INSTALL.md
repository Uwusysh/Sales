# Installation Guide - Follow-Up Automation v2.0

## 🚀 Quick Install (3 Minutes)

### Step 1: Install Dependencies

```bash
npm run install:all
```

This installs dependencies for:
- Root project
- Client (React frontend)
- Server (Express backend)

**Expected output:**
```
✓ Root dependencies installed
✓ Client dependencies installed
✓ Server dependencies installed
```

---

### Step 2: Configure Environment (Optional)

For basic testing with mock data, **skip this step**.

For Google Sheets integration:

```bash
cd server
cp .env.example .env
nano .env  # or use your editor
```

Add:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=my-secret-key-for-development
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

### Step 3: Start Application

```bash
npm run dev
```

**Expected output:**
```
> concurrently "npm run dev:client" "npm run dev:server"

[client] VITE v5.0.8  ready in 500 ms
[client] ➜  Local:   http://localhost:5173/
[server] 🚀 Server running on port 5000
[server] 📊 Environment: development
[server] 🔗 API available at http://localhost:5000/api
```

---

### Step 4: Login

1. Open browser: **http://localhost:5173**
2. You'll see the login page
3. Enter credentials:
   - Username: `agent.smith`
   - Password: `password123`
4. Click "Sign In"

**Success!** You're now in the dashboard.

---

## 📋 System Requirements

### Required
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **Browser**: Chrome, Firefox, Safari, or Edge (latest)

### Check Your Versions
```bash
node --version  # Should be v18+
npm --version   # Should be v9+
```

### Update if Needed
```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

---

## 🔧 Detailed Installation

### Option 1: Automated (Recommended)

```bash
# Clone or download the project
cd follow-up-automation

# Install everything
npm run install:all

# Start development
npm run dev
```

---

### Option 2: Manual Installation

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..

# Start both
npm run dev
```

---

### Option 3: Individual Services

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install
npm run dev
```

---

## 🐛 Troubleshooting Installation

### Issue: "npm: command not found"

**Solution:**
Install Node.js from https://nodejs.org

---

### Issue: "EACCES: permission denied"

**Solution (Linux/Mac):**
```bash
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

**Solution (Windows):**
Run terminal as Administrator

---

### Issue: "Port 5173 already in use"

**Solution:**
Kill the process using that port:

**Mac/Linux:**
```bash
lsof -ti:5173 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or change the port in `client/vite.config.ts`

---

### Issue: "Port 5000 already in use"

**Solution:**
Change port in `server/.env`:
```env
PORT=5001
```

---

### Issue: "Module not found" errors

**Solution:**
```bash
# Clean install
rm -rf node_modules client/node_modules server/node_modules
rm package-lock.json client/package-lock.json server/package-lock.json
npm run install:all
```

---

### Issue: "gyp ERR!" or native module errors

**Solution:**
```bash
# Install build tools

# Windows
npm install --global windows-build-tools

# Mac
xcode-select --install

# Linux (Ubuntu/Debian)
sudo apt-get install build-essential

# Then reinstall
npm run install:all
```

---

## 📦 Dependencies Installed

### Root Package
```json
{
  "concurrently": "^8.2.2"
}
```

### Client (Frontend)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@vitejs/plugin-react": "^4.2.1",
  "tailwindcss": "^3.3.6",
  "typescript": "^5.3.3",
  "vite": "^5.0.8"
}
```

### Server (Backend)
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "googleapis": "^128.0.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "cookie-parser": "^1.4.6",
  "nodemon": "^3.0.1"
}
```

**Total Size:** ~300MB (including node_modules)

---

## ✅ Verify Installation

### 1. Check Services Running

**Frontend:**
```bash
curl http://localhost:5173
# Should return HTML
```

**Backend:**
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"OK",...}
```

---

### 2. Check Login

1. Open http://localhost:5173
2. Should see login page
3. Enter: `agent.smith` / `password123`
4. Should redirect to dashboard

---

### 3. Check Real-Time Dashboard

1. Click "Real-Time Dashboard" tab
2. Should see lead cards
3. Look for green pulse (auto-refresh indicator)
4. Click "Set WhatsApp Reminder" on any lead

---

### 4. Check Follow-Ups Management

1. Click "Follow-Ups Management" tab
2. Should see filter buttons
3. Should see leads table
4. Try editing a follow-up

---

## 🎯 Post-Installation Steps

### 1. Enable Desktop Notifications

When prompted by browser:
- Click "Allow"
- Or go to browser settings → Notifications
- Allow for localhost:5173

---

### 2. Configure Google Sheets (Optional)

See [SETUP.md](./SETUP.md) for detailed instructions:
1. Create Google Sheet
2. Get service account credentials
3. Add to `server/.env`
4. Restart server

---

### 3. Add Custom Users (Optional)

Edit `server/src/services/userService.js`:

```javascript
const defaultUsers = [
  {
    username: 'your.agent',
    password: '$2a$10$...', // bcrypt hash
    agentName: 'Your Agent Name',
    role: 'agent'
  }
]
```

Generate password hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(console.log)"
```

---

### 4. Customize JWT Secret

For production, use strong secret:

```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to server/.env
JWT_SECRET=generated_secret_here
```

---

## 🚀 Production Installation

### On Render/Heroku/etc:

1. **Connect Repository**
   - Link your Git repository

2. **Set Build Command**
   ```bash
   npm run build
   ```

3. **Set Start Command**
   ```bash
   npm start
   ```

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-strong-secret
   GOOGLE_SHEET_ID=your_sheet_id
   GOOGLE_SERVICE_ACCOUNT_JSON={...}
   ```

5. **Deploy**
   - Platform will build and start automatically

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📁 Directory Structure After Install

```
follow-up-automation/
├── node_modules/              # Root dependencies
├── client/
│   ├── node_modules/          # Frontend dependencies (~200MB)
│   ├── dist/                  # Build output (after build)
│   └── ...
├── server/
│   ├── node_modules/          # Backend dependencies (~100MB)
│   ├── dist/                  # Build output (after build)
│   └── ...
└── ...
```

**Total:** ~300MB for all node_modules

---

## 🧹 Uninstall / Clean

### Remove Dependencies
```bash
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
rm -rf client/dist
rm -rf server/dist
```

### Remove Lock Files
```bash
rm package-lock.json
rm client/package-lock.json
rm server/package-lock.json
```

### Complete Removal
```bash
# Remove everything except source code
git clean -fdx
```

---

## 🔄 Updating

### Update Dependencies
```bash
# Update all packages
npm update
cd client && npm update && cd ..
cd server && npm update && cd ..
```

### Update to Latest Versions
```bash
# Check outdated packages
npm outdated

# Update specific package
npm install package-name@latest

# Update all to latest (careful!)
npx npm-check-updates -u
npm run install:all
```

---

## 💡 Tips

### Speed Up Installation
```bash
# Use npm ci for faster install (if package-lock exists)
npm ci
cd client && npm ci && cd ..
cd server && npm ci && cd ..
```

### Offline Installation
```bash
# Create offline cache
npm pack

# Install from cache
npm install ./package.tgz
```

### Docker Installation
```bash
# Build image
docker build -t follow-up-automation .

# Run container
docker run -p 5000:5000 -e JWT_SECRET=secret follow-up-automation
```

---

## ✅ Installation Complete!

You should now have:
- ✅ All dependencies installed
- ✅ Frontend running on port 5173
- ✅ Backend running on port 5000
- ✅ Login page accessible
- ✅ Demo accounts working

### Next Steps:
1. Read [WHATS_NEW.md](./WHATS_NEW.md) for features
2. Read [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for auth details
3. Configure Google Sheets (optional)
4. Deploy to production

---

## 📞 Need Help?

### Installation Issues
- Check Node.js version (must be 18+)
- Try clean install (remove node_modules)
- Check firewall/antivirus
- Run as administrator (Windows)

### Runtime Issues
- Check both services are running
- Verify ports are not in use
- Check browser console for errors
- Review server logs

### Documentation
- [START_HERE.md](./START_HERE.md) - Quick start
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Cheat sheet
- [README.md](./README.md) - Main docs

---

**Installation Time:** ~3-5 minutes  
**Disk Space Required:** ~300MB  
**Network Required:** Yes (for npm packages)

**Happy coding! 🎉**

