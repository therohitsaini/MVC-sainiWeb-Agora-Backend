# Shopify App Proper Installation Guide (हिंदी में)

## 🎯 Goal
App ko Shopify Admin Panel se directly install karna aur Shopify admin me embedded app ke roop me open karna.

---

## 📋 Step 1: Shopify Partner Dashboard Setup

### **1.1: Partner Dashboard me Login**
1. **Shopify Partner Dashboard** me jao: https://partners.shopify.com
2. Apne account se login karo
3. **"Apps"** section me jao

### **1.2: App Create/Select Karo**
- Agar app already hai, to select karo
- Agar naya app banana hai:
  - **"Create app"** button click karo
  - App name enter karo (e.g., "Video Call App")
  - **"Create"** click karo

---

## 🔧 Step 2: App Configuration

### **2.1: App Setup Section**
1. App ke **"App setup"** section me jao
2. Yaha pe ye settings configure karo:

#### **App URL (Application URL)**
```
https://shopifyconsultant-app.vercel.app
```
**Ya agar local development:**
```
http://localhost:5001
```

**Important:** Ye URL wo hai jaha app ka frontend hosted hai. Shopify admin panel me app isi URL par open hogi.

#### **Allowed redirection URL(s)**
Add karo ye URLs:
```
http://localhost:5001/app/callback
https://your-backend-domain.com/app/callback
http://localhost:5001/local-consultant/public/app/callback
https://your-backend-domain.com/local-consultant/public/app/callback
```

**Note:** Production me `https://` use karo, local development me `http://localhost:5001` use karo.

---

## 🔑 Step 3: Client Credentials

### **3.1: Client ID aur Secret Copy Karo**
1. **"Client credentials"** section me jao
2. **Client ID** copy karo
3. **Client secret** copy karo (ye sensitive hai, share mat karo)

### **3.2: Environment Variables Set Karo**
`.env` file me add karo:
```env
SHOPIFY_CLIENT_ID=your_client_id_here
SHOPIFY_API_SECRET=your_client_secret_here
SHOPIFY_SCOPES=read_customers,read_products
APP_URL=http://localhost:5001
```

---

## 🎨 Step 4: App Embedding Setup

### **4.1: Embedded App Configuration**
Shopify admin panel me app ko embedded karne ke liye:

1. **"App setup"** → **"Embedded app"** section me jao
2. **"Enable embedded app"** checkbox check karo
3. **App URL** set karo:
   ```
   https://shopifyconsultant-app.vercel.app
   ```

### **4.2: Frontend Setup (Important)**
Aapke frontend app me Shopify App Bridge setup karna hoga:

```javascript
// Frontend me (React/Vue/etc)
import { AppProvider } from '@shopify/app-bridge-react';
import { Provider } from '@shopify/app-bridge-react';

// App Bridge initialize karo
const config = {
  apiKey: 'YOUR_CLIENT_ID',
  host: new URLSearchParams(location.search).get('host'),
  forceRedirect: true,
};

// App Provider wrap karo
<AppProvider config={config}>
  <YourApp />
</AppProvider>
```

---

## 🚀 Step 5: Installation Flow

### **5.1: Development Store me Test**
1. **Shopify Partner Dashboard** → **"Development stores"**
2. Development store create karo (ya existing use karo)
3. Store me login karo

### **5.2: App Install Karo**
1. Development store ke **Admin Panel** me jao
2. **"Apps"** → **"App and sales channel settings"**
3. **"Develop apps"** section me jao
4. Apni app select karo
5. **"Install"** button click karo

### **5.3: Automatic Flow**
```
1. User "Install" click karta hai
   ↓
2. Shopify redirect karta hai: 
   https://your-backend.com/app/install?shop=store.myshopify.com
   ↓
3. installShopifyApp() function call hota hai
   ↓
4. Shopify OAuth page par redirect
   ↓
5. User permissions approve karta hai
   ↓
6. Callback: /app/callback?code=...&hmac=...
   ↓
7. authCallback() function call hota hai
   ↓
8. Access token save hota hai
   ↓
9. Frontend app open hota hai Shopify admin me
```

---

## 🔄 Step 6: App Open Karna

### **6.1: Shopify Admin Panel me**
1. **Shopify Admin Panel** me jao
2. **"Apps"** section me jao
3. Installed apps me apni app dikhegi
4. App par click karo
5. App Shopify admin panel me embedded mode me open hogi

### **6.2: Direct URL (Development)**
Development me directly test karne ke liye:
```
https://admin.shopify.com/store/YOUR_STORE/apps/YOUR_APP_ID
```

---

## 📝 Step 7: Code Updates Required

### **7.1: Backend - Redirect URL Fix**
`authCallback` function me redirect URL update karo:

```javascript
// ✅ Sahi way - Frontend app URL
const redirectUrl = `https://shopifyconsultant-app.vercel.app?shop=${encodeURIComponent(shop)}`;
return res.redirect(redirectUrl);
```

### **7.2: Frontend - Shopify App Bridge**
Frontend me Shopify App Bridge install karo:

```bash
npm install @shopify/app-bridge @shopify/app-bridge-react
```

### **7.3: Frontend - App Bridge Setup**
```javascript
// App.js ya main file me
import { AppProvider } from '@shopify/app-bridge-react';

function App() {
  // Shopify se host parameter extract karo
  const host = new URLSearchParams(window.location.search).get('host');
  const shop = new URLSearchParams(window.location.search).get('shop');
  
  const config = {
    apiKey: process.env.REACT_APP_SHOPIFY_CLIENT_ID,
    host: host,
    forceRedirect: true,
  };

  return (
    <AppProvider config={config}>
      <YourDashboard />
    </AppProvider>
  );
}
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: App Admin Panel me Open Nahi Ho Rahi**
**Problem:** App install ho gayi lekin admin panel me open nahi ho rahi

**Solution:**
- Check karo ki **"Embedded app"** enabled hai
- Verify karo ki **App URL** sahi hai
- Frontend me **App Bridge** properly setup hai ya nahi

### **Issue 2: Redirect Loop**
**Problem:** App redirect loop me phas rahi hai

**Solution:**
- Check karo ki `forceRedirect: true` set hai
- Verify karo ki callback URL sahi hai
- Check karo ki HMAC validation pass ho rahi hai

### **Issue 3: CORS Errors**
**Problem:** Frontend se backend API calls me CORS error

**Solution:**
- Backend me CORS properly configure karo
- Shopify App Bridge use karo API calls ke liye (direct fetch nahi)

---

## ✅ Checklist

### **Backend Setup:**
- [ ] Shopify Partner Dashboard me app create/select kiya
- [ ] Client ID aur Secret `.env` me set kiye
- [ ] Redirect URLs Shopify dashboard me add kiye
- [ ] `/app/install` route working hai
- [ ] `/app/callback` route working hai
- [ ] HMAC validation pass ho rahi hai
- [ ] Access token database me save ho raha hai

### **Frontend Setup:**
- [ ] Shopify App Bridge install kiya
- [ ] AppProvider properly setup kiya
- [ ] App URL Shopify dashboard me set kiya
- [ ] Embedded app enabled kiya

### **Testing:**
- [ ] Development store me app install ki
- [ ] App Shopify admin panel me open ho rahi hai
- [ ] App embedded mode me properly load ho rahi hai
- [ ] All features working hain

---

## 🎯 Quick Start Commands

### **Backend:**
```bash
# Server start karo
npm start

# Check karo ki routes working hain
curl http://localhost:5001/app/install?shop=your-store.myshopify.com
```

### **Frontend:**
```bash
# Dependencies install karo
npm install @shopify/app-bridge @shopify/app-bridge-react

# Development server start karo
npm start
```

---

## 📌 Important URLs

### **Development:**
- **Backend:** `http://localhost:5001`
- **Frontend:** `http://localhost:3000` (ya jo bhi port use kar rahe ho)
- **Install URL:** `http://localhost:5001/app/install?shop=store.myshopify.com`
- **Callback URL:** `http://localhost:5001/app/callback`

### **Production:**
- **Backend:** `https://your-backend-domain.com`
- **Frontend:** `https://shopifyconsultant-app.vercel.app`
- **Install URL:** `https://your-backend-domain.com/app/install?shop=store.myshopify.com`
- **Callback URL:** `https://your-backend-domain.com/app/callback`

---

## 🔗 Useful Links

- **Shopify Partner Dashboard:** https://partners.shopify.com
- **Shopify App Bridge Docs:** https://shopify.dev/docs/apps/tools/app-bridge
- **OAuth Documentation:** https://shopify.dev/docs/apps/auth/oauth

---

**Note:** Ab aapki app properly Shopify admin panel me embedded mode me open hogi! 🎉

