# Gmail Compose URL - Quick Reference

## 🚀 Gmail Compose URL Format

```
https://mail.google.com/mail/?view=cm&fs=1&to=EMAIL&su=SUBJECT&body=BODY
```

## 📋 Parameters

| Param | Purpose | Example |
|-------|---------|---------|
| `view=cm` | Compose mail | Required |
| `fs=1` | Full screen | Optional |
| `to` | Recipient | `to=user@example.com` |
| `su` | Subject | `su=Hello%20World` |
| `body` | Message body | `body=Dear%20Sir%2C%0A%0A...` |
| `cc` | CC recipient | `cc=manager@example.com` |
| `bcc` | BCC recipient | `bcc=admin@example.com` |

## 💻 JavaScript Implementation

```typescript
// Build Gmail URL
const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

// Open in new tab
window.open(gmailUrl, '_blank');
```

## ⚠️ Important Notes

1. **Always URL-encode** parameters using `encodeURIComponent()`
2. **User must be logged into Gmail** for this to work
3. **Pop-ups must be allowed** in browser settings
4. **URL length limit** is ~2000 characters (browser dependent)

## 🔄 mailto vs Gmail URL

| Feature | `mailto:` | Gmail URL |
|---------|-----------|-----------|
| Opens in | Default email client | Gmail web |
| Browser control | ❌ No | ✅ Yes |
| Pre-fill fields | ✅ Yes | ✅ Yes |
| New tab | ❌ No | ✅ Yes |
| Requires login | ❌ No | ✅ Yes |

## 🎯 Use Cases

- ✅ Web applications (CRM, ticketing systems)
- ✅ Marketing email templates
- ✅ Customer support portals
- ✅ Internal communication tools
- ❌ Mobile apps (use mailto: instead)
- ❌ Offline applications

## 🧪 Test URL

Try this in your browser:
```
https://mail.google.com/mail/?view=cm&fs=1&to=test@example.com&su=Test%20Email&body=This%20is%20a%20test%20message
```
