# Shopify App Installation Flow (हिंदी में)

## 📋 Complete Installation Process

### **Step 1: App Install Request**
```
User Action: Shopify Admin Panel se app install karta hai
URL: https://admin.shopify.com/store/your-store/apps
```

**Kya Hota Hai:**
1. User Shopify Admin Panel me jata hai
2. "Apps" section me jata hai
3. App ko install karne ke liye click karta hai
4. Shopify redirect karta hai: `https://sainiweb-agora-backend.onrender.com/app/install?shop=rohit-12345839.myshopify.com`

---

### **Step 2: installShopifyApp Function Call**
```
Route: GET /app/install
Function: installShopifyApp()
```

**Function Kya Karta Hai:**
1. ✅ Shop name validate karta hai
2. 🔐 Random `state` generate karta hai (security ke liye)
3. 🔗 Callback URL banata hai: `http://localhost:5001/app/callback`
4. 🚀 Shopify OAuth authorize URL banata hai:
   ```
   https://store-name.myshopify.com/admin/oauth/authorize?
     client_id=YOUR_CLIENT_ID
     &scope=read_customers,read_products
     &redirect_uri=http://localhost:5001/app/callback
     &state=random_state_string
   ```
5. 👤 User ko Shopify permission page par redirect karta hai

---

### **Step 3: User Approves Permissions**
```
User Action: Shopify par permissions approve karta hai
Location: Shopify OAuth Permission Page
```

**Kya Hota Hai:**
- User ko Shopify ek page dikhata hai
- Page par dikhata hai ki app ko kya permissions chahiye:
  - ✅ Read customers
  - ✅ Read products
- User "Install" button click karta hai
- Shopify permissions approve kar deta hai

---

### **Step 4: Shopify Redirects to Callback**
```
Shopify Action: User ko callback URL par redirect karta hai
URL: http://localhost:5001/app/callback?shop=...&code=...&hmac=...&state=...
```

**Query Parameters:**
- `shop`: Store name (e.g., `store-name.myshopify.com`)
- `code`: Temporary authorization code (ye code access token ke liye use hoga)
- `hmac`: Security signature (verify karne ke liye ki request Shopify se hi aayi hai)
- `state`: Same state jo Step 2 me generate kiya tha
- `host`: Admin host (optional)
- `timestamp`: Request timestamp (optional)

---

### **Step 5: authCallback Function Call**
```
Route: GET /app/callback
Function: authCallback()
```

**Function Kya Karta Hai (Step by Step):**

#### **5.1: Parameters Extract**
```javascript
const { shop, hmac, code } = req.query;
```

#### **5.2: HMAC Validation (Security Check)**
```javascript
// HMAC verify karta hai ki request authentic hai
// Agar HMAC match nahi karta, to request reject ho jati hai
```

**Process:**
1. `hmac` ko query params se remove karo
2. Baaki sab parameters ko alphabetically sort karo
3. Message string banayo: `code=...&host=...&shop=...&timestamp=...`
4. Apne `SHOPIFY_API_SECRET` se HMAC generate karo
5. Received HMAC se compare karo
6. ✅ Agar match karta hai → Continue
7. ❌ Agar match nahi karta → Error return karo

#### **5.3: Exchange Code for Access Token**
```javascript
// Temporary code ko permanent access token me convert karo
POST https://store-name.myshopify.com/admin/oauth/access_token
Body: {
  client_id: YOUR_CLIENT_ID,
  client_secret: YOUR_CLIENT_SECRET,
  code: TEMPORARY_CODE
}
```

**Response:**
```json
{
  "access_token": "shpat_xxxxxxxxxxxxx",
  "scope": "read_customers,read_products"
}
```

#### **5.4: Save to Database**
```javascript
// Shop information aur access token ko MongoDB me save karo
{
  shop: "store-name.myshopify.com",
  accessToken: "shpat_xxxxxxxxxxxxx",
  installedAt: "2024-01-15T10:30:00Z"
}
```

#### **5.5: Redirect to Frontend**
```javascript
// User ko frontend dashboard par redirect karo
redirect("https://your-frontend.com/dashboard/home?shop=store-name.myshopify.com")
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Shopify Admin Panel se App Install karta hai        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. GET /app/install?shop=store.myshopify.com                │
│    installShopifyApp() function call hota hai               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Shopify OAuth Authorize URL banata hai                   │
│    Redirect: https://store.myshopify.com/admin/oauth/...    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User Shopify par Permissions Approve karta hai           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Shopify Callback URL par Redirect karta hai              │
│    GET /app/callback?shop=...&code=...&hmac=...             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. authCallback() function automatically call hota hai        │
│    - HMAC verify karta hai                                   │
│    - Code ko access token me convert karta hai              │
│    - Database me save karta hai                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. User ko Frontend Dashboard par Redirect karta hai        │
│    ✅ Installation Complete!                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Important Points

### **Environment Variables Required:**
```env
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_API_SECRET=shpss_your_secret_key
SHOPIFY_SCOPES=read_customers,read_products
APP_URL=http://localhost:5001
```

### **Routes Setup:**
```javascript
// Routes/shopifyRoute.js
GET /app/install    → installShopifyApp()
GET /app/callback   → authCallback()
```

### **Security:**
- ✅ HMAC validation - verify karta hai ki request Shopify se hi aayi hai
- ✅ State parameter - CSRF attacks se protect karta hai
- ✅ Access token securely database me store hota hai

### **Database Schema:**
```javascript
{
  shop: String,           // "store-name.myshopify.com"
  accessToken: String,    // "shpat_xxxxxxxxxxxxx"
  installedAt: Date       // Installation timestamp
}
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: HMAC Validation Failed**
**Problem:** `❌ HMAC validation failed`

**Solution:**
- Check karo ki `SHOPIFY_API_SECRET` environment variable sahi hai
- Verify karo ki Shopify app settings me same secret configured hai
- `.env` file me correct secret add karo

### **Issue 2: Missing Parameters**
**Problem:** `❌ Missing required parameters`

**Solution:**
- Check karo ki Shopify callback URL sahi hai
- Verify karo ki `shop`, `code`, aur `hmac` parameters aa rahe hain

### **Issue 3: Access Token Not Received**
**Problem:** `Failed to get access token`

**Solution:**
- Check karo ki `client_id` aur `client_secret` sahi hain
- Verify karo ki code expire nahi hua (code sirf ek baar use hota hai)
- Check network requests in browser console

---

## 📝 Testing the Flow

### **Manual Test:**
1. Browser me jao: `http://localhost:5001/app/install?shop=your-store.myshopify.com`
2. Shopify OAuth page par redirect hoga
3. Permissions approve karo
4. Callback URL par automatically redirect hoga
5. Console me logs check karo
6. Database me shop entry verify karo

### **Check Logs:**
```bash
# Terminal me ye logs dikhne chahiye:
🔁 Auth callback triggered
shop store-name.myshopify.com
🧮 Generated HMAC: xxxxx
📦 Received HMAC: xxxxx
✅ HMAC validation successful
➡️ Redirecting to: https://frontend.com/dashboard
```

---

## ✅ Success Criteria

Installation successful hai agar:
- ✅ HMAC validation pass ho gaya
- ✅ Access token successfully receive ho gaya
- ✅ Shop information database me save ho gaya
- ✅ User frontend dashboard par redirect ho gaya

---

**Note:** Ye flow automatically chalega jab bhi user Shopify app install karega. Aapko manually kuch nahi karna padega - sab kuch automatic hai! 🚀

