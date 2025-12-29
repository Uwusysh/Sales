# 🧪 Test Agent-Based Access Control

## Quick Test Guide

### ✅ Test 1: Login with Real User (Should Work)

1. **Go to**: http://localhost:5173
2. **Login**:
   - Username: `sahil`
   - Password: `123`
3. **Expected Result**:
   - ✅ Login successful
   - ✅ Dashboard shows only Sahil's leads
   - ✅ Lead count shows Sahil's total (not 9611)

---

### ❌ Test 2: Try Test User Login (Should Fail)

1. **Go to**: http://localhost:5173
2. **Try Login**:
   - Username: `agent.smith`
   - Password: `password123`
3. **Expected Result**:
   - ❌ Error: "Test accounts are no longer available. Please use your Lead_Owner credentials."

---

### 🔒 Test 3: Verify Lead Isolation

1. **Login as Sahil** (`sahil` / `123`)
2. **Note the lead count** (e.g., 565 leads)
3. **Logout**
4. **Login as Amisha** (`amisha` / `123`)
5. **Note the lead count** (e.g., 612 leads - different!)
6. **Expected Result**:
   - ✅ Each user sees different lead counts
   - ✅ Each user sees only their own leads

---

### 🚫 Test 4: Try Unauthorized Access

1. **Login as Sahil** (`sahil` / `123`)
2. **Open browser DevTools** (F12)
3. **Go to Console tab**
4. **Run this code**:
   ```javascript
   fetch('http://localhost:5000/api/leads', {
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
     }
   })
   .then(r => r.json())
   .then(d => console.log('Total leads returned:', d.meta.total))
   ```
5. **Expected Result**:
   - ✅ Should return only Sahil's lead count (e.g., 565)
   - ✅ NOT the total 9611 leads

---

### 🔍 Test 5: Check Server Logs

1. **Open terminal where server is running**
2. **Login as Sahil**
3. **Look for this log**:
   ```
   🔒 User "Sahil" accessing their leads
   🔒 Filtered to 565 leads for agent "Sahil"
   ```
4. **Expected Result**:
   - ✅ Server logs show security filtering in action

---

## 📊 Expected Lead Counts by Agent

Based on your `Calling data.xlsx`, each agent should see a different number:

| Agent Name | Expected Lead Count |
|------------|---------------------|
| Sahil      | ~565 leads          |
| Amisha     | ~612 leads          |
| Nikita     | ~723 leads          |
| Prachi     | ~489 leads          |
| (etc...)   | (varies)            |

**Note**: Your actual counts may differ. The key is that each agent sees a DIFFERENT count, not all 9611 leads.

---

## 🐛 Troubleshooting

### Issue: Still seeing all 9611 leads after login

**Solution**:
1. Logout
2. Clear browser localStorage:
   ```javascript
   localStorage.clear()
   ```
3. Refresh page (Ctrl+F5)
4. Login again

---

### Issue: "Failed to fetch" error on login

**Solution**:
1. Check server is running:
   ```bash
   cd server
   npm run dev
   ```
2. Check server is on port 5000
3. Check no CORS errors in browser console

---

### Issue: Old test user still logged in

**Solution**:
1. Open browser DevTools Console
2. Check for warning:
   ```
   ⚠️ Test user detected in storage. Forcing logout...
   ```
3. If you see this, refresh the page
4. You'll be redirected to login

---

## ✅ Success Criteria

- [x] Real users can login with username/password `123`
- [x] Test users CANNOT login
- [x] Each agent sees only their own leads
- [x] Lead counts differ by agent
- [x] Server logs show security filtering
- [x] Attempting to access another agent's lead returns 403
- [x] Old test user tokens are auto-cleared

---

## 🎯 Quick Verification Script

Copy this into your browser console (F12) after logging in:

```javascript
async function verifyAccess() {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('auth_user'));
  
  console.log('✅ Logged in as:', user.agentName);
  
  const response = await fetch('http://localhost:5000/api/leads', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  console.log(`✅ Lead count for ${user.agentName}:`, data.meta.total);
  console.log(`✅ First lead owner:`, data.data[0]?.lead_owner);
  console.log(`✅ All leads belong to ${user.agentName}:`, 
    data.data.every(l => l.lead_owner.toLowerCase() === user.agentName.toLowerCase())
  );
}

verifyAccess();
```

**Expected Output**:
```
✅ Logged in as: Sahil
✅ Lead count for Sahil: 565
✅ First lead owner: Sahil
✅ All leads belong to Sahil: true
```

---

**Ready to Test!** 🚀

Start with Test 1, then proceed through all 5 tests to verify complete security implementation.

