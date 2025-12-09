# 🔔 Push Notification Testing Guide (हिंदी में)

## 📋 Socket Disconnect के बाद Notification Test करने का तरीका

### **Step 1: Server Start करें**

```bash
npm start
# या
npm run dev
```

Server start होने पर console में दिखना चाहिए:
```
✅ Firebase Admin initialized from serviceAccountKey.json file
🔥 Socket connected: [socket-id]
```

---

### **Step 2: User के पास FCM Token होना चाहिए**

#### **A. Frontend से FCM Token Save करें:**

**API Endpoint:**
```
POST /api/save-fcm-token
```

**Request Body:**
```json
{
  "token": "fcm-token-here",
  "userId": "user-id-here",
  "shopId": "shop-id-here"
}
```

**Example (Postman/Thunder Client):**
```javascript
POST http://localhost:3001/api/save-fcm-token
Content-Type: application/json

{
  "token": "dKxYz123...your-fcm-token",
  "userId": "691eafcff95528ab305eba59",
  "shopId": "690c374f605cb8b946503ccb"
}
```

#### **B. Database में Check करें:**

MongoDB में check करें कि user के पास `firebaseToken` है:

```javascript
// MongoDB Query
db.ragisterUsers.findOne(
  { _id: ObjectId("691eafcff95528ab305eba59") },
  { firebaseToken: 1, fullname: 1, email: 1 }
)
```

**Expected Result:**
```json
{
  "_id": "...",
  "fullname": "User Name",
  "firebaseToken": {
    "token": "dKxYz123...",
    "updatedAt": "2025-01-XX...",
    "userAgent": "...",
    "browser": "...",
    "os": "..."
  }
}
```

---

### **Step 3: Socket Connect करें**

#### **Frontend Code (Example):**

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// User register करें
socket.emit('register', '691eafcff95528ab305eba59');

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});
```

#### **Server Console में दिखेगा:**
```
🔥 Socket connected: abc123xyz
🔥 Online users: { '691eafcff95528ab305eba59': 'abc123xyz' }
🔥 User registered: 691eafcff95528ab305eba59
🔥 User activated: 691eafcff95528ab305eba59
```

---

### **Step 4: Socket Disconnect करें**

#### **Method 1: Frontend से Disconnect**
```javascript
socket.disconnect();
```

#### **Method 2: Browser Tab Close करें**
- Browser tab को close करें
- Socket automatically disconnect हो जाएगा

#### **Method 3: Network Disconnect**
- Internet connection बंद करें
- Socket timeout के बाद disconnect होगा

---

### **Step 5: Server Console में Check करें**

Disconnect के बाद server console में ये logs दिखने चाहिए:

#### **✅ Success Case:**
```
 User disconnected: 691eafcff95528ab305eba59
 Remaining online users: []
📬 Pending messages for user 691eafcff95528ab305eba59: 0
✅ Push notification sent successfully: projects/consultant-app-24ceb/messages/0:1234567890
✅ Push notification sent to disconnected user: 691eafcff95528ab305eba59
```

#### **⚠️ No FCM Token Case:**
```
 User disconnected: 691eafcff95528ab305eba59
 Remaining online users: []
📬 Pending messages for user 691eafcff95528ab305eba59: 0
ℹ️ No FCM token found for user: 691eafcff95528ab305eba59
```

#### **❌ Error Case:**
```
 User disconnected: 691eafcff95528ab305eba59
 Remaining online users: []
📬 Pending messages for user 691eafcff95528ab305eba59: 0
❌ Error sending push notification: [error message]
⚠️ Failed to send push notification: [error details]
```

---

### **Step 6: Device पर Notification Check करें**

#### **Android:**
- Notification tray में check करें
- Title: "Connection Status"
- Body: "You went offline. You have X new message(s) waiting for you."

#### **iOS:**
- Notification center में check करें
- Lock screen पर भी दिख सकती है

#### **Web Browser:**
- Browser notification permission allow होना चाहिए
- Notification popup दिखेगा

---

## 🧪 Complete Testing Script

### **Test Case 1: Basic Disconnect Notification**

1. ✅ User को socket से connect करें
2. ✅ User के पास valid FCM token है
3. ✅ Socket disconnect करें
4. ✅ Server logs check करें
5. ✅ Device पर notification check करें

**Expected Result:**
- Server log: `✅ Push notification sent successfully`
- Device: Notification received

---

### **Test Case 2: Disconnect with Pending Messages**

1. ✅ User को socket से connect करें
2. ✅ User के पास valid FCM token है
3. ✅ User को कुछ unread messages send करें (isRead: false)
4. ✅ Socket disconnect करें
5. ✅ Server logs check करें

**Expected Result:**
- Server log: `📬 Pending messages for user XXX: 5`
- Notification body: "You have 5 new messages waiting for you."

---

### **Test Case 3: No FCM Token**

1. ✅ User को socket से connect करें
2. ✅ User के पास FCM token नहीं है (database में check करें)
3. ✅ Socket disconnect करें
4. ✅ Server logs check करें

**Expected Result:**
- Server log: `ℹ️ No FCM token found for user: XXX`
- No notification sent (expected behavior)

---

### **Test Case 4: Invalid FCM Token**

1. ✅ User को socket से connect करें
2. ✅ User के पास invalid/expired FCM token है
3. ✅ Socket disconnect करें
4. ✅ Server logs check करें

**Expected Result:**
- Server log: `⚠️ Invalid or unregistered FCM token`
- Server log: `🗑️ Removed invalid FCM token for user: XXX`
- Database में token automatically remove हो जाएगा

---

## 🔍 Debugging Tips

### **1. Firebase Initialization Check:**

Server start पर check करें:
```bash
✅ Firebase Admin initialized from serviceAccountKey.json file
```

अगर ये नहीं दिख रहा:
- `serviceAccountKey.json` file check करें
- File path correct है या नहीं
- JSON format valid है या नहीं

---

### **2. FCM Token Check:**

Database query:
```javascript
db.ragisterUsers.find(
  { _id: ObjectId("YOUR_USER_ID") },
  { firebaseToken: 1 }
)
```

अगर token नहीं है:
- Frontend से `/api/save-fcm-token` API call करें
- Token properly save हो रहा है या नहीं check करें

---

### **3. Socket Connection Check:**

Server console में check करें:
```
🔥 Socket connected: [socket-id]
🔥 User registered: [user-id]
```

अगर ये नहीं दिख रहा:
- Socket connection properly हो रहा है या नहीं
- `register` event emit हो रहा है या नहीं

---

### **4. Notification Send Check:**

Server console में check करें:
```
✅ Push notification sent successfully: [message-id]
```

अगर error आ रहा है:
- Firebase credentials valid हैं या नहीं
- FCM token valid है या नहीं
- Network connectivity check करें

---

## 📱 Frontend Testing Code (Complete Example)

```javascript
// socket-test.js
import io from 'socket.io-client';

const socket = io('http://localhost:3001');
const userId = '691eafcff95528ab305eba59';

// Connect
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
  
  // Register user
  socket.emit('register', userId);
});

// Disconnect manually (for testing)
setTimeout(() => {
  console.log('🔌 Disconnecting...');
  socket.disconnect();
}, 5000); // 5 seconds बाद disconnect

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

// Error handling
socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});
```

---

## 🎯 Quick Test Checklist

- [ ] Server start हो रहा है
- [ ] Firebase initialized हो रहा है (console log check)
- [ ] User के पास FCM token है (database check)
- [ ] Socket connect हो रहा है (console log check)
- [ ] User register हो रहा है (console log check)
- [ ] Socket disconnect हो रहा है
- [ ] Server log में notification send message दिख रहा है
- [ ] Device पर notification receive हो रही है

---

## 🐛 Common Issues & Solutions

### **Issue 1: "No FCM token found"**
**Solution:** 
- Frontend से FCM token save करें
- Database में check करें token save हुआ या नहीं

### **Issue 2: "Firebase Admin not initialized"**
**Solution:**
- `serviceAccountKey.json` file check करें
- File path correct है या नहीं
- JSON format valid है या नहीं

### **Issue 3: "Invalid token"**
**Solution:**
- FCM token regenerate करें
- Frontend से नया token save करें

### **Issue 4: Notification नहीं आ रही**
**Solution:**
- Device पर notification permission check करें
- FCM token valid है या नहीं
- Firebase project में Cloud Messaging enable है या नहीं

---

## ✅ Success Indicators

अगर सब कुछ सही है, तो आपको दिखेगा:

1. **Server Console:**
   ```
   ✅ Firebase Admin initialized
   🔥 Socket connected
   🔥 User registered
   User disconnected
   📬 Pending messages: X
   ✅ Push notification sent successfully
   ```

2. **Device:**
   - Notification popup
   - Title: "Connection Status"
   - Body: "You went offline..."

3. **Database:**
   - User status: `isActive: false`
   - FCM token: Present (if valid)

---

## 📞 Need Help?

अगर कोई problem आए:
1. Server logs check करें
2. Database में user data check करें
3. Firebase Console में project settings check करें
4. FCM token validity check करें

