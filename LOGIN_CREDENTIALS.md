# 🔐 Login Credentials - Follow-Up Automation System

## ✅ All Users Generated from Lead_Owner Column

**Total Users:** 17  
**Default Password:** `123` (for all users)  
**Generated:** December 29, 2025

---

## 👥 Complete User List

| # | Agent Name | Username | Password |
|---|------------|----------|----------|
| 1 | Amisha | `amisha` | `123` |
| 2 | Anil | `anil` | `123` |
| 3 | Anjali | `anjali` | `123` |
| 4 | Gauri | `gauri` | `123` |
| 5 | Jyotsna | `jyotsna` | `123` |
| 6 | Manideep | `manideep` | `123` |
| 7 | Megha | `megha` | `123` |
| 8 | Milan | `milan` | `123` |
| 9 | Miloni | `miloni` | `123` |
| 10 | Nikita | `nikita` | `123` |
| 11 | Prachi | `prachi` | `123` |
| 12 | Pushpalata | `pushpalata` | `123` |
| 13 | Rachana | `rachana` | `123` |
| 14 | Radheyshyam | `radheyshyam` | `123` |
| 15 | Sahil | `sahil` | `123` |
| 16 | Sanaya | `sanaya` | `123` |
| 17 | Vipul | `vipul` | `123` |

---

## 🚀 How to Login

1. **Open Application**  
   Navigate to: http://localhost:5173

2. **Enter Credentials**  
   - **Username:** Your name in lowercase (e.g., `amisha`, `sahil`)
   - **Password:** `123`

3. **Click "Sign In"**

4. **View Your Leads**  
   You'll only see leads assigned to you in the Lead_Owner column

---

## 📋 Important Notes

✅ **Test accounts removed** - No more `agent.smith`, `agent.jones`, or `admin`  
✅ **Real users only** - All 17 users from your actual data  
✅ **Simple password** - Easy to remember: `123`  
✅ **Agent-specific** - Each user sees only their own leads  
✅ **Auto-generated** - Users created from `Calling data.xlsx`  

---

## 🔄 Regenerating Users

If you need to regenerate users (e.g., after adding new Lead Owners to Excel):

```bash
cd server
npm run generate-users
```

This will:
- Read the latest Excel file
- Find all unique Lead_Owner values
- Regenerate `userService.js`
- Update `GENERATED_USERS.txt` and `GENERATED_USERS.json`

---

## 🔒 Security Notes

### For Development
- Password `123` is acceptable for testing
- All passwords are hashed with bcrypt

### For Production
⚠️ **Important:** Change all passwords before deploying to production!

To change passwords:
1. Edit `server/src/scripts/generateUsersFromExcel.js`
2. Change line: `const passwordHash = await bcrypt.hash('123', 10);`
3. Replace `'123'` with your desired password
4. Run `npm run generate-users` again

---

## 📁 Generated Files

| File | Purpose |
|------|---------|
| `GENERATED_USERS.txt` | Human-readable list of all users |
| `GENERATED_USERS.json` | JSON format for programmatic access |
| `LOGIN_CREDENTIALS.md` | This file - quick reference |
| `server/src/services/userService.js` | Updated with new users |

---

## ✨ What Changed

### ❌ Removed
- Test account: `agent.smith` / `password123`
- Test account: `agent.jones` / `password123`
- Test account: `admin` / `password123`
- Demo credentials from login page

### ✅ Added
- 17 real users from Lead_Owner column
- All with password: `123`
- Auto-generation script
- User list files

---

## 🎯 Quick Test

Try logging in as:
- **Username:** `amisha`
- **Password:** `123`

You should see only the leads assigned to Amisha!

---

## 💡 Tips

1. **Usernames are case-insensitive** - `Amisha`, `amisha`, `AMISHA` all work
2. **Spaces become dots** - If name is "John Doe", username is `john.doe`
3. **Each agent sees only their leads** - Filtered by Lead_Owner column
4. **Password is the same for everyone** - `123` (change in production!)

---

**Need help?** Check `GENERATED_USERS.txt` for the complete list!

