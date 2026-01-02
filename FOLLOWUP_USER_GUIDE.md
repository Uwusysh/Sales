# Follow-Up Management - User Guide

## 🎯 Quick Start

### Accessing Follow-Ups Dashboard

1. **Navigate to Follow-Ups**
   - Click "Follow-Ups" in the left sidebar (Clock icon)
   - Or visit: `http://localhost:3000/followups`

2. **Choose Your View**
   - **My Follow-Ups**: See only your assigned follow-ups
   - **All Team**: See entire team's follow-ups (managers/admins)

## 📊 Dashboard Overview

### Stats Cards (Top Row)
Click any card to filter the list below:

- **Overdue** (Red) - Past due date, needs immediate attention
- **Due Today** (Blue) - Scheduled for today
- **Upcoming** (Light Blue) - Future follow-ups
- **Total Active** (Gray) - All pending follow-ups

### Follow-Up List
Each row shows:
- Client name and phone number
- Date & time (with "Overdue" badge if past due)
- Type (Call, WhatsApp, Email, Meeting)
- Assigned owner
- Lead details (product, location)
- Priority level (High/Medium/Low)

## ✅ Completing a Follow-Up

### Step-by-Step:

1. **Click on any follow-up** in the list
   - A modal will open with follow-up details

2. **Add Outcome/Notes**
   - Describe what happened during the call/meeting
   - Example: "Client requested quote for 20ft container"

3. **Schedule Next Follow-Up (Optional)**
   - Set the next follow-up date
   - Leave blank if no further follow-up needed

4. **Click "Mark as Completed"**
   - Follow-up is marked complete in Google Sheets
   - Automatically removed from active lists
   - Notes are saved to the follow-up history

## 📅 Scheduling New Follow-Ups

### From Leads Page:

1. **Open any lead** by clicking on it
2. **Scroll to "Activity Timeline"** section
3. **Click "+ Add Follow-up"** button
4. **Fill in the form**:
   - New Date (required)
   - Time (optional)
   - Type (Call/WhatsApp/Email/Meeting/Site Visit)
   - Notes/Remarks
5. **Click "Save Follow-up"**
   - Added to Google Sheets "Daily Follow-up DB"
   - Appears in Follow-Ups dashboard
   - Updates lead's follow-up date

## 🔍 Understanding Visual Indicators

### Color Coding:
- **Red Background** = Overdue (past due date)
- **Blue Background** = Due today
- **White Background** = Upcoming

### Badges:
- **"Overdue"** with ⚠️ icon = Past due date
- **"Today"** with 🕐 icon = Due today
- **"Tomorrow"** = Due tomorrow
- **Date only** = Future date

### Priority Levels:
- **Red badge** = High priority
- **Yellow badge** = Medium priority
- **Blue badge** = Low priority

## 🔄 Auto-Refresh

- Dashboard automatically refreshes every 60 seconds
- Manual refresh available (click refresh icon)
- Live sync indicator shows connection status

## 💡 Best Practices

### Daily Routine:
1. **Morning**: Check "Due Today" tab
2. **Throughout Day**: Complete follow-ups as you make calls
3. **End of Day**: Review "Overdue" tab for missed calls

### Completing Follow-Ups:
- ✅ Always add outcome notes
- ✅ Schedule next follow-up if conversation ongoing
- ✅ Be specific in notes (helps team understand context)
- ❌ Don't leave follow-ups incomplete if you made the call

### Scheduling Follow-Ups:
- ✅ Set realistic dates (don't over-promise)
- ✅ Add time if specific appointment
- ✅ Use appropriate type (Call vs Meeting)
- ✅ Add context in notes

## 🎨 Features at a Glance

| Feature | Location | Purpose |
|---------|----------|---------|
| **Overdue Highlighting** | All lists | Impossible to miss overdue items |
| **Today's View** | Follow-Ups dashboard | Focus on today's tasks |
| **Completion Modal** | Click any follow-up | Quick completion workflow |
| **Timeline View** | Lead details | See complete history |
| **My/All Toggle** | Top right | Personal vs team view |
| **Auto-Refresh** | Automatic | Always up-to-date |

## 📱 Mobile Usage

- Fully responsive design
- Swipe to open sidebar
- Tap to complete follow-ups
- All features available on mobile

## 🔗 Integration with Leads

### From Lead Details:
- View complete follow-up history
- See timeline of all interactions
- Add new follow-ups inline
- Each follow-up shows date, type, notes

### From Follow-Ups Dashboard:
- Click follow-up to see lead details
- Complete and schedule next action
- All changes sync to lead record

## 🚨 Important Notes

1. **Google Sheets Sync**
   - All changes save to "Daily Follow-up DB" sheet
   - Completed follow-ups marked with "Completed = Yes"
   - Lead's follow-up date updates automatically

2. **Completion is Final**
   - Once marked complete, cannot be undone
   - Make sure to add notes before completing
   - Schedule next follow-up if needed

3. **Team Visibility**
   - All team members can see all follow-ups
   - Use "My Follow-Ups" for personal view
   - Managers can monitor team activity

## 📞 Example Workflow

### Scenario: Following up with client about quotation

1. **Morning**: See "Govind Milk - Call - Today" in dashboard
2. **Make Call**: Discuss quotation details
3. **Complete Follow-Up**:
   - Click on the follow-up
   - Add notes: "Client wants to proceed. Requested delivery timeline."
   - Schedule next: Tomorrow (for delivery confirmation)
   - Mark as completed
4. **Result**: 
   - Original follow-up marked complete
   - New follow-up created for tomorrow
   - Lead's follow-up date updated
   - All synced to Google Sheets

## 🎯 Success Metrics

Track your performance:
- **Completion Rate**: Completed vs Total follow-ups
- **Overdue Count**: Should trend toward zero
- **Response Time**: Time between scheduling and completion
- **Next Action Rate**: % of completions with next follow-up scheduled

---

**Need Help?** Contact your system administrator or refer to the main documentation.
