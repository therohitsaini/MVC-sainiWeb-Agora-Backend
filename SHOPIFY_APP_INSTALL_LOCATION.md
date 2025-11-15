# Shopify App Install Kaha Se Hota Hai? (हिंदी में)

## 🎯 Answer: App Install 2 Jagah Se Ho Sakta Hai

### **Option 1: Shopify Admin Panel (Store Owner Ke Liye)** ⭐
### **Option 2: Shopify Partner Dashboard (Developer Ke Liye)**

---

## 📍 Option 1: Shopify Admin Panel Se Install (Main Method)

### **Step-by-Step:**

#### **Step 1: Shopify Admin Panel Me Jao**
1. Store owner ke account se login karo
2. **Shopify Admin Panel** me jao: `https://admin.shopify.com/store/your-store`

#### **Step 2: Apps Section Me Jao**
1. Left sidebar me **"Apps and sales channels"** click karo
2. Ya top bar me **"Apps"** icon click karo

#### **Step 3: App Install Karo**
1. **"Develop apps"** tab me jao (development apps ke liye)
2. Ya **"Shopify App Store"** tab me jao (published apps ke liye)
3. Apni app dhundho (e.g., "VC Node" ya "Video Call App")
4. **"Install"** button click karo

#### **Step 4: Automatic Flow**
```
User "Install" button click karta hai
  ↓
Shopify automatically:
GET http://localhost:5001/app/install?shop=store.myshopify.com
  ↓
installShopifyApp() function execute hota hai
  ↓
User Shopify permission page par redirect hota hai
  ↓
User permissions approve karta hai
  ↓
Shopify automatically:
GET http://localhost:5001/app/callback?shop=...&code=...&hmac=...
  ↓
authCallback() function execute hota hai
  ↓
App installed ✅
```

---

## 📍 Option 2: Shopify Partner Dashboard Se Install (Developer Testing)

### **Step-by-Step:**

#### **Step 1: Partner Dashboard Me Jao**
1. **Shopify Partner Dashboard** me login karo: https://partners.shopify.com
2. **"Apps"** section me jao
3. Apni app select karo (e.g., "Video Call App")

#### **Step 2: Installs Section Me Jao**
1. App ke **"Home"** page me jao
2. Right side me **"Installs"** card dikhega
3. **"Install app"** button click karo
4. Ya **"Copy install link"** icon se link copy karo

#### **Step 3: Development Store Me Install**
1. Development store select karo
2. Install link open karo
3. Ya manually development store ke admin panel me jao
4. Waha se install karo (Option 1 ke tarah)

---

## 🎯 Visual Guide

### **Shopify Admin Panel:**
```
Shopify Admin Panel
├── Left Sidebar
│   └── "Apps and sales channels" ← Yaha click karo
│       │
│       └── Main Content
│           ├── "Develop apps" tab ← Development apps ke liye
│           │   └── "VC Node" app
│           │       └── "Install" button ← Yaha click karo
│           │
│           └── "Shopify App Store" tab ← Published apps ke liye
```

### **Shopify Partner Dashboard:**
```
Shopify Partner Dashboard
├── Apps
│   └── Video Call App
│       └── Home
│           └── Right Column
│               └── "Installs" card
│                   └── "Install app" button ← Yaha click karo
```

---

## 🔄 Complete Installation Flow

### **Method 1: Admin Panel Se (Recommended)**

```
1. Store Owner Shopify Admin Panel me jata hai
   ↓
2. Apps → Develop apps → Apni app select karta hai
   ↓
3. "Install" button click karta hai
   ↓
4. ⚡ Shopify automatically install URL hit karta hai
   GET /app/install?shop=store.myshopify.com
   ↓
5. Backend installShopifyApp() function execute hota hai
   ↓
6. User Shopify permission page par redirect hota hai
   ↓
7. User "Allow" click karta hai
   ↓
8. ⚡ Shopify automatically callback URL hit karta hai
   GET /app/callback?shop=...&code=...&hmac=...
   ↓
9. Backend authCallback() function execute hota hai
   ↓
10. App installed ✅
```

### **Method 2: Partner Dashboard Se (Developer Testing)**

```
1. Developer Partner Dashboard me jata hai
   ↓
2. Apps → Video Call App → Home
   ↓
3. "Installs" card me "Install app" button click karta hai
   ↓
4. Development store select karta hai
   ↓
5. Same flow as Method 1 (Admin Panel se)
```

---

## 📋 Where to Find Install Button

### **Shopify Admin Panel:**
- **Location:** Apps and sales channels → Develop apps
- **Button:** "Install" button app ke saath
- **Who:** Store owner ya developer

### **Shopify Partner Dashboard:**
- **Location:** Apps → Your App → Home → Installs card
- **Button:** "Install app" button
- **Who:** Developer (testing ke liye)

---

## ✅ Summary

| Location | Who | Button Location |
|----------|-----|----------------|
| **Shopify Admin Panel** | Store Owner | Apps → Develop apps → Install button |
| **Partner Dashboard** | Developer | Apps → Home → Installs → Install app button |

**Main Method:** Shopify Admin Panel se install karna (store owner ke liye)

**Testing Method:** Partner Dashboard se install link copy karke development store me install karna (developer ke liye)

---

## 🎯 Quick Answer

**Q: App install kaha se hota hai?**
**A:** 
1. **Shopify Admin Panel** → Apps → Develop apps → Install button ⭐ (Main)
2. **Partner Dashboard** → Apps → Home → Installs → Install app button (Testing)

**Both methods automatically backend routes hit karte hain!** 🚀

