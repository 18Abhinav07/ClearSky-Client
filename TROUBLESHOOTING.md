# Troubleshooting: Vite Template Still Showing

## The Issue
You're seeing the default Vite template instead of the ClearSky authentication app.

## Why This Happens
1. Browser cache is serving old files
2. Dev server needs to be restarted
3. Browser is not refreshing properly

## Solution: Follow These Steps

### Step 1: Stop the Current Dev Server
Press `Ctrl+C` in the terminal where `npm run dev` is running

### Step 2: Clear Vite Cache
```bash
rm -rf node_modules/.vite
```

### Step 3: Restart the Dev Server
```bash
npm run dev
```

### Step 4: Hard Refresh Your Browser
- **Chrome/Edge (Mac)**: `Cmd + Shift + R`
- **Chrome/Edge (Windows/Linux)**: `Ctrl + Shift + R`
- **Firefox (Mac)**: `Cmd + Shift + R`
- **Firefox (Windows/Linux)**: `Ctrl + F5`
- **Safari**: `Cmd + Option + R`

### Step 5: Open Browser DevTools
1. Open DevTools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Look for any errors (red text)
4. If you see errors, share them

### Step 6: Check Network Tab
1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for any failed requests (red status codes)

## Alternative: Open in Incognito/Private Mode
This bypasses all cache:
- **Chrome**: `Cmd/Ctrl + Shift + N`
- **Firefox**: `Cmd/Ctrl + Shift + P`
- **Safari**: `Cmd + Shift + N`

Then navigate to: http://localhost:5173

## If Still Not Working

### Check if files are correct:
```bash
# Should show the App component with WagmiProvider
cat src/App.tsx

# Should show Landing page exports
cat src/pages/Landing/index.tsx

# Should show AppRouter component
cat src/app/router/index.tsx
```

### Verify environment variables:
```bash
cat .env
```

Should contain:
```
VITE_CDP_PROJECT_ID=938d7f29-6906-41e7-ae27-aef0ed11a63b
VITE_CDP_API_BASE_PATH=https://api.cdp.coinbase.com
VITE_API_BASE_URL=http://localhost:3000
```

### Check for port conflicts:
```bash
lsof -i :5173
```

If something else is using port 5173, kill it:
```bash
kill -9 <PID>
```

## What You Should See

### Landing Page
- Purple gradient background
- "Welcome to ClearSky" heading
- "Get Started" button (CDP AuthButton)
- Three feature cards at the bottom

### NOT the Vite Template
You should NOT see:
- "Vite + React" heading
- Count button
- "Edit src/App.tsx and save to test HMR"

## Still Having Issues?

### Full Reset:
```bash
# Stop dev server
# Then run:
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

### Nuclear Option:
```bash
# Stop dev server
rm -rf node_modules
rm -rf node_modules/.vite
rm -rf dist
npm install --legacy-peer-deps
npm run dev
```

## Common Errors in Console

### "Failed to fetch CDP config"
→ CDP Project ID might be invalid. Check `.env` file.

### "Cannot find module './app/router'"
→ Router file might not be compiled. Restart dev server.

### "useAccount is not a function"
→ Wagmi not installed properly. Run: `npm install --legacy-peer-deps`

### Blank white page
→ Check console for JavaScript errors
→ Make sure React Router is installed

## Expected Console Output (Normal)

When the app loads correctly, you should see:
- No red errors
- Possibly some warnings about peer dependencies (normal)
- CDP initialization logs (if debugging enabled)
