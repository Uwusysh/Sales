# Technical Prompt for AI - Gmail Integration Problem

## Use this prompt to explain your problem to AI assistants:

---

### Problem Statement

I have a web application (CRM system) with an "Open in Email Client" button that currently uses the `mailto:` protocol. When users click this button, it opens the **default email client** configured in their operating system (typically **Outlook** or **Thunderbird**), but I need it to specifically open the **Gmail web interface in Chrome browser**.

### Current Implementation (Not Working)

```javascript
const mailtoLink = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
window.location.href = mailtoLink;
```

**Problems with this approach:**
- Opens the OS default email client (Outlook), not Gmail
- Redirects the current browser tab, losing the CRM page context
- No control over which application handles the email
- Not browser-based

### Requirements

1. **Force Gmail:** Open Gmail web interface specifically, not any other email client
2. **Pre-fill fields:** Populate recipient (`to`), subject (`su`), and body (`body`) with data from the application
3. **New tab behavior:** Open Gmail in a new Chrome tab while keeping the CRM page open in the original tab
4. **No fallback:** Do NOT fall back to `mailto:` if Gmail isn't available - Gmail only
5. **URL encoding:** Properly encode all special characters including emojis, newlines, and symbols
6. **Chrome-specific:** Solution should work in Chrome browser

### Acceptance Criteria

- ✅ Clicking the button opens Gmail compose page in Google Chrome
- ✅ Recipient email is pre-filled in the "To" field
- ✅ Subject line is pre-filled with proper encoding
- ✅ Email body is pre-filled with proper encoding (including emojis like 🚚❄️)
- ✅ Gmail opens in a **new tab**, not replacing the current page
- ✅ The CRM page remains open and accessible
- ✅ No `mailto:` protocol is used
- ✅ Special characters (&, %, newlines, etc.) are properly encoded

### Sample Data

```javascript
const recipient = "chavandhiksha2003@gmail.com";
const subject = "Crystal Group - Cold Chain Solutions for Test | Dry";
const body = `Dear Sir,

Greetings from Crystal Group (Cold Chain Containers) !!

I hope this email finds you well, Thanks for your valued enquiry given on our website for Dry.

I will share with you details soon.

We're Excited To Share Our Brochure – Your One-Stop Guide To Crystal Group's Cold Chain Solutions! 
Crystal Group Offers: 🚚❄️

• Reefer & Super Freezer Containers 🥶
• Blast Freezers & Cold Rooms ❄️
• Reefer Trucks & ISO Tanks 🚛
• Scalable Cold Storage 📦
• Customised Containers & Dry Storage 🏭
• Freight Forwarding 🌍

Trusted Since 1962 By FMCG, Pharma, Dairy & More. 

Let's Keep Your Products Fresh And Safe! 

Looking Forward To Your Feedback. 💬

Attachment: Please click the below links for Company Brief & Profile 👇

Company Profile: https://linktr.ee/crystallogisticcoolchain?lt_utm_source=lt_share_link#484303228

Company Brief: https://linktr.ee/crystallogisticcoolchain#484299689


Thanks & Regards,
Sahil
Crystal Group - Cold Chain Solutions`;
```

### Questions

1. **How do I construct a Gmail compose URL** that opens the Gmail web interface with pre-filled fields?
2. **What URL parameters** does Gmail support for composing emails?
3. **How do I properly encode** the subject and body to handle special characters and emojis?
4. **How do I ensure it opens in a new tab** instead of redirecting the current page?
5. **What is the correct JavaScript code** to implement this solution?

### Environment

- **Frontend Framework:** React with TypeScript
- **Target Browser:** Google Chrome
- **User State:** Users are already logged into Gmail in their browser
- **Current Tab Behavior:** Using `window.location.href` (need to change this)

### Constraints

- Must NOT use `mailto:` protocol
- Must NOT open desktop email clients
- Must work exclusively with Gmail web interface
- Must preserve the current page (no redirects)
- Must handle URLs in the email body correctly

### Expected Solution Format

Please provide:
1. The Gmail compose URL format
2. Explanation of URL parameters
3. JavaScript code to construct and open the URL
4. Proper URL encoding technique
5. How to open in new tab vs current tab

---

## Alternative Shorter Version

If you need a more concise version:

---

**Problem:** My `mailto:` link opens Outlook instead of Gmail. How do I open Gmail web compose in Chrome with pre-filled to/subject/body fields in a new tab?

**Current Code:**
```javascript
window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
```

**Requirements:**
- Open Gmail (not default client)
- Pre-fill to, subject, body
- New tab (keep current page)
- No mailto: fallback
- Handle emojis & special chars

**Sample Data:**
- To: `user@gmail.com`
- Subject: `Test | Special & Chars`
- Body: `Hello! 🚚❄️\n\nLine 2`

What's the Gmail URL format and JavaScript code?

---

## Expected Answer Format

When an AI receives this prompt, they should provide:

### 1. Gmail URL Format
```
https://mail.google.com/mail/?view=cm&fs=1&to=EMAIL&su=SUBJECT&body=BODY
```

### 2. Parameter Explanation
- `view=cm` - Compose mail view
- `fs=1` - Full screen mode
- `to` - Recipient email
- `su` - Subject (URL encoded)
- `body` - Message body (URL encoded)

### 3. JavaScript Implementation
```javascript
const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
window.open(gmailUrl, '_blank');
```

### 4. Key Points
- Use `encodeURIComponent()` for encoding
- Use `window.open(url, '_blank')` for new tab
- User must be logged into Gmail
- Pop-ups must be allowed

---

## Additional Context

### Why `mailto:` Doesn't Work

The `mailto:` URI scheme is a **protocol handler** that delegates to the operating system. The OS then:
1. Checks the default email client setting
2. Launches that application (Outlook, Thunderbird, Apple Mail, etc.)
3. Cannot be forced to use a specific web service

### Why Gmail URL Works

Gmail provides a **web endpoint** for composing emails:
1. Direct HTTPS URL to Gmail servers
2. Accepts query parameters for pre-filling
3. Opens in browser (no OS delegation)
4. Full JavaScript control

### URL Encoding Examples

| Character | Encoded | Reason |
|-----------|---------|--------|
| Space | `%20` | URLs don't allow spaces |
| `@` | `%40` | Reserved character |
| `&` | `%26` | Parameter separator |
| `\n` (newline) | `%0A` | Line breaks |
| Emoji 🚚 | `%F0%9F%9A%9A` | UTF-8 encoding |

---

## Testing the Solution

Once implemented, test with:

1. **Basic test:** Simple subject and body
2. **Special chars:** Subject with `&`, `|`, `%`
3. **Newlines:** Body with multiple paragraphs
4. **Emojis:** Body with 🚚❄️🥶
5. **URLs:** Body containing `https://` links
6. **Long content:** Body > 500 characters

---

## Common Pitfalls to Avoid

❌ **Don't use `window.location.href`** - This redirects the current tab  
✅ **Use `window.open(url, '_blank')`** - This opens a new tab

❌ **Don't forget `encodeURIComponent()`** - Raw strings break URLs  
✅ **Encode all parameters** - Handles special characters

❌ **Don't use just `encodeURI()`** - Doesn't encode all characters  
✅ **Use `encodeURIComponent()`** - Encodes everything needed

❌ **Don't assume user is logged in** - Will redirect to login  
✅ **Document requirement** - User must be logged into Gmail

---

## References

Provide these to the AI for additional context:

- [Stack Overflow: URL to compose Gmail](https://stackoverflow.com/questions/6548570/url-to-compose-a-message-in-gmail)
- [MDN: window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
- [MDN: encodeURIComponent()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)

---

**End of Technical Prompt**

Copy the sections above that match your needs when asking AI assistants for help with this problem.
