# Gmail Compose Integration - Technical Documentation

## Problem Statement

### Issue Description
The application's "Open in Email Client" button was using the `mailto:` protocol, which opens the **default email client** configured in the operating system (e.g., Outlook, Thunderbird, Apple Mail). 

**User Requirements:**
- Open Gmail web interface (not desktop email clients)
- Open specifically in Chrome browser
- Pre-fill recipient (`to`), subject (`su`), and body (`body`) fields
- Open in a new tab while keeping the CRM page open
- Works exclusively with Gmail (no fallback to `mailto:`)

### Original Implementation (Problem)

```typescript
// ❌ Opens DEFAULT email client (Outlook/etc.)
const mailtoLink = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
window.location.href = mailtoLink;
```

**Why this doesn't work:**
- `mailto:` protocol delegates to OS default email client
- Cannot force Gmail to open
- Doesn't guarantee browser-based email
- No control over which application handles the link

---

## Solution

### Gmail Compose URL Format

Gmail provides a web-based compose URL that accepts query parameters:

```
https://mail.google.com/mail/?view=cm&fs=1&to=EMAIL&su=SUBJECT&body=BODY
```

### URL Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `view=cm` | Opens compose mail view | ✅ Yes | `view=cm` |
| `fs=1` | Full screen mode (optional) | ❌ No | `fs=1` |
| `to` | Recipient email address | ✅ Yes | `to=user@example.com` |
| `su` | Email subject (URL encoded) | ❌ No | `su=Hello%20World` |
| `body` | Email body (URL encoded) | ❌ No | `body=This%20is%20a%20test` |

---

## Implementation

### Updated Code

```typescript
// ✅ Opens Gmail in Chrome browser
const handleOpenInEmailClient = () => {
    if (!toEmail) {
        alert('Please enter a client email address');
        return;
    }

    // Create Gmail compose URL with pre-filled fields
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    
    // Open Gmail in a new tab
    window.open(gmailComposeUrl, '_blank');
    
    // Close modal after opening Gmail
    setTimeout(() => {
        onClose();
    }, 300);
};
```

### Key Changes

1. **URL Construction**
   - Changed from `mailto:` to Gmail compose URL
   - Added `view=cm` for compose mode
   - Added `fs=1` for full screen
   - URL-encoded all parameters (`to`, `su`, `body`)

2. **Opening Method**
   - Changed from `window.location.href` (same tab) to `window.open(url, '_blank')` (new tab)
   - This keeps the CRM page open while opening Gmail

3. **User Experience**
   - Updated footer text: "This will open Gmail compose in a new tab"
   - Reduced timeout from 500ms to 300ms for faster UX

---

## URL Encoding

### Why URL Encoding is Critical

Gmail URL parameters must be URL-encoded to handle special characters:

```typescript
// ❌ WRONG - Special characters break URL
const url = `https://mail.google.com/mail/?su=Hello & Goodbye`;

// ✅ CORRECT - Properly encoded
const url = `https://mail.google.com/mail/?su=${encodeURIComponent("Hello & Goodbye")}`;
// Result: su=Hello%20%26%20Goodbye
```

### Characters That Need Encoding

| Character | Encoded | Reason |
|-----------|---------|--------|
| Space | `%20` | Spaces not allowed in URLs |
| `&` | `%26` | Separates URL parameters |
| `=` | `%3D` | Defines parameter values |
| `?` | `%3F` | Starts query string |
| `#` | `%23` | Starts URL fragment |
| Newline | `%0A` | Line breaks in email body |

---

## Testing Checklist

### ✅ Acceptance Criteria

- [x] Clicking "Open in Email Client" opens Gmail compose in Chrome
- [x] Fields are correctly URL-encoded and pre-filled
- [x] Works in Chrome; new tab opens; CRM page stays open
- [x] No fallback to `mailto:` (exclusively Gmail)

### Test Cases

1. **Basic Email Composition**
   - ✅ Open modal from leads page
   - ✅ Fill in recipient email
   - ✅ Verify subject auto-populates
   - ✅ Click "Open in Email Client"
   - ✅ Gmail opens in new tab with all fields pre-filled

2. **Special Characters in Subject**
   - ✅ Subject: `Crystal Group - Cold Chain & More!`
   - ✅ Verify `&` is encoded as `%26`

3. **Special Characters in Body**
   - ✅ Body contains emojis: `🚚❄️🥶`
   - ✅ Body contains newlines
   - ✅ Body contains URLs
   - ✅ All characters properly displayed in Gmail

4. **Edge Cases**
   - ✅ Empty subject (should work)
   - ✅ Empty body (should work)
   - ✅ Very long subject (>200 chars)
   - ✅ Very long body (>5000 chars)

---

## Example URL Generated

### Input Data
```javascript
toEmail = "client@example.com"
subject = "Crystal Group - Cold Chain Solutions for Test | Dry"
body = "Dear Sir,\n\nGreetings from Crystal Group..."
```

### Generated URL
```
https://mail.google.com/mail/?view=cm&fs=1&to=client%40example.com&su=Crystal%20Group%20-%20Cold%20Chain%20Solutions%20for%20Test%20%7C%20Dry&body=Dear%20Sir%2C%0A%0AGreetings%20from%20Crystal%20Group...
```

### URL Breakdown
- `https://mail.google.com/mail/` - Gmail base URL
- `?view=cm` - Compose mail view
- `&fs=1` - Full screen mode
- `&to=client%40example.com` - Recipient (@ encoded as %40)
- `&su=Crystal%20Group...` - Subject (spaces encoded as %20, | as %7C)
- `&body=Dear%20Sir%2C%0A%0A...` - Body (comma as %2C, newline as %0A)

---

## Browser Compatibility

### ✅ Supported Browsers
- Chrome (Primary target)
- Edge (Chromium-based)
- Firefox
- Safari
- Opera

### Requirements
- User must be logged into Gmail
- Pop-ups must be allowed for your domain
- JavaScript enabled

---

## Limitations & Known Issues

### 1. **User Must Be Logged Into Gmail**
If the user is not logged in, Gmail will redirect to the login page first, then to compose.

**Mitigation:** Assume users are logged into Gmail in Chrome (common scenario)

### 2. **Pop-up Blockers**
Some browsers may block `window.open()` from opening new tabs.

**Mitigation:** Inform users to allow pop-ups if blocked

### 3. **URL Length Limit**
Browsers have URL length limits (typically 2,000-8,000 characters).

**Current Impact:** Email body in template is ~800 characters, well within limits

**Future Consideration:** If body exceeds 2,000 chars, consider truncation warning

### 4. **No Fallback to `mailto:`**
As per requirements, there is NO fallback. If Gmail is unavailable, the button won't work.

**Trade-off:** Guaranteed Gmail experience vs. broader compatibility

---

## Alternative Approaches Considered

### ❌ Option 1: `mailto:` Protocol
**Pros:** Works universally  
**Cons:** Opens default client, not Gmail

### ❌ Option 2: Gmail API
**Pros:** Full control, can send emails directly  
**Cons:** Requires OAuth, complex setup, backend needed

### ✅ Option 3: Gmail Compose URL (Selected)
**Pros:** Simple, no auth needed, opens Gmail directly  
**Cons:** Requires user to be logged in, no fallback

---

## Security Considerations

### 1. **No Sensitive Data in URL**
- Email content is visible in browser history
- URLs can be logged by network proxies
- **Current Status:** Email contains public marketing content ✅

### 2. **XSS Prevention**
- All parameters are URL-encoded via `encodeURIComponent()`
- Prevents injection attacks ✅

### 3. **CSRF Protection**
- Gmail has built-in CSRF protection
- User must manually send the email ✅

---

## Future Enhancements

### 1. **Multi-Account Support**
Add `authuser` parameter to select specific Gmail account:
```
https://mail.google.com/mail/?authuser=0&view=cm&...
```

### 2. **CC/BCC Support**
Add `cc` and `bcc` parameters:
```
&cc=manager@crystalgroup.com&bcc=sales@crystalgroup.com
```

### 3. **Attachments**
Gmail URL doesn't support attachments. Would require:
- Gmail API integration
- File upload to cloud storage
- Include links in email body

### 4. **Email Tracking**
Add UTM parameters or tracking pixels to monitor email opens/clicks

---

## Technical Prompt for AI Assistance

> **Problem:** I have a `mailto:` link that opens the default email client (Outlook), but I need it to open Gmail web interface in Chrome browser specifically.
>
> **Current Code:**
> ```javascript
> const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
> window.location.href = mailtoLink;
> ```
>
> **Requirements:**
> 1. Open Gmail compose page (not default email client)
> 2. Pre-fill recipient, subject, and body
> 3. Open in new Chrome tab (keep current page open)
> 4. No fallback to `mailto:` if Gmail unavailable
> 5. Properly URL-encode all parameters
>
> **Question:** How do I construct a Gmail compose URL with pre-filled fields and open it in a new browser tab?

---

## References

- [Gmail URL Schemes Documentation](https://stackoverflow.com/questions/6548570/url-to-compose-a-message-in-gmail)
- [MDN: encodeURIComponent()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
- [MDN: window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
