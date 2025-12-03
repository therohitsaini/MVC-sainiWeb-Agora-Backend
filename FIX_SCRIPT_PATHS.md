# Script Paths Fix Guide

## Problem
Console me errors dikh rahe hain:
```
Uncaught SyntaxError: Unexpected token '<'
main.js:1
vendor.js:1
runtime.js:1
```

**Reason:** Script paths wrong hain. Build ke baad paths hash ke saath hote hain.

## Solution

### Step 1: Build Folder Me Exact Paths Check Karo

React app me build folder check karo:

```bash
cd your-react-app
cat build/index.html
```

Ya manually `build/index.html` open karo.

### Step 2: Exact Script Paths Copy Karo

`build/index.html` me ye kuch dikhega:

```html
<script src="/static/js/main.abc123.js"></script>
<script src="/static/js/vendor.def456.js"></script>
<script src="/static/js/runtime.ghi789.js"></script>
```

**Exact paths note karo** (hash ke saath).

### Step 3: `public/index.html` Me Update Karo

Aapke `public/index.html` me scripts update karo:

```html
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
  
  <!-- Exact paths from build/index.html (hash ke saath) -->
  <script src="/static/js/main.abc123.js"></script>
  <script src="/static/js/vendor.def456.js"></script>
  <script src="/static/js/runtime.ghi789.js"></script>
</body>
```

**Important:** Hash ke saath exact paths add karo!

### Step 4: React App Rebuild Karo

```bash
npm run build
```

### Step 5: Test Karo

Backend route hit karo aur check karo ki scripts load ho rahe hain.

## Alternative: Dynamic Paths (Advanced)

Agar har build ke baad manually update nahi karna chahte, to:

1. `asset-manifest.json` use karo (Create React App me hota hai)
2. Ya build script me paths automatically inject karo

## Quick Fix

**Sabse easy:** Build folder me `index.html` se exact paths copy karo aur `public/index.html` me paste karo (hash ke saath).

