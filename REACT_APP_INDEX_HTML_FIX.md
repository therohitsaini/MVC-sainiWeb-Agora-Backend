# React App `public/index.html` Me Scripts Add Karne Ka Guide

## Current File
Aapka `public/index.html` file standard Create React App template hai. Isme scripts automatically add nahi hote - build ke baad add hote hain.

## Problem
Backend se HTML fetch karne par scripts nahi mil rahe kyunki:
- Build ke baad scripts add hote hain
- Backend fetch me wo scripts nahi dikhte

## Solution

### Step 1: Build Folder Check Karo

1. React app me build karo:
```bash
npm run build
```

2. `build/index.html` file check karo - usme scripts honge:
```html
<script src="/static/js/main.abc123.js"></script>
<script src="/static/js/vendor.def456.js"></script>
```

3. Exact paths note karo (hash ke saath)

### Step 2: `public/index.html` Me Scripts Add Karo

Aapke current `public/index.html` me `<body>` ke end me scripts add karo:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Web site created using create-react-app" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    
    <!-- YAHAN SCRIPTS ADD KARO (build folder se paths copy karo) -->
    <script src="/static/js/main.js"></script>
    <script src="/static/js/vendor.js"></script>
    <!-- Ya jo bhi build folder me exact paths hain -->
  </body>
</html>
```

### Step 3: Important Notes

1. **Development vs Production:**
   - Development me (`npm start`): Scripts automatically add hote hain
   - Production me (`npm run build`): Build folder me scripts add hote hain
   - Backend fetch me: Explicitly add karna padega

2. **Script Paths:**
   - Build ke baad paths hash ke saath hote hain: `main.abc123.js`
   - Lekin `public/index.html` me hash ke bina add kar sakte ho: `main.js`
   - Build process automatically correct path use karega

3. **Alternative:**
   - Agar scripts add nahi karna chahte, to **iframe approach** use karo
   - Iframe me scripts automatically load honge

## Recommended Approach

**Option 1: Scripts Add Karo (If you want direct HTML injection)**
- `public/index.html` me scripts add karo
- Build karo
- Backend fetch me scripts mil jayenge

**Option 2: Iframe Use Karo (Easiest - Recommended)**
- React app me koi changes nahi
- Backend me iframe add karo
- 100% kaam karega

## Quick Fix

Agar abhi bhi scripts nahi mil rahe, to:

1. **Build folder check karo:**
   ```bash
   cd your-react-app
   npm run build
   cat build/index.html | grep script
   ```

2. **Exact paths copy karo aur `public/index.html` me add karo**

3. **Ya iframe use karo** - sabse easy solution!

