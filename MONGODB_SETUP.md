# MongoDB Atlas Connection Setup

## Quick Fix: Add Your IP to Whitelist

The connection error indicates your IP address is not whitelisted in MongoDB Atlas.

### Steps to Fix:

1. **Get Your Public IP Address**
   - Visit: https://whatismyipaddress.com/
   - Or run: `curl https://api.ipify.org`

2. **Add IP to MongoDB Atlas**
   - Go to: https://cloud.mongodb.com/
   - Navigate to: **Network Access** → **IP Access List**
   - Click **"Add IP Address"**
   - Click **"Add Current IP Address"** (recommended)
   - Or manually enter your IP: `YOUR_IP_ADDRESS`
   - Click **"Confirm"**

3. **Alternative: Allow All IPs (Testing Only)**
   - For development/testing, you can temporarily allow all IPs:
   - Add: `0.0.0.0/0` to the IP Access List
   - ⚠️ **Warning**: This is less secure. Only use for development.

4. **Wait 1-2 minutes** for changes to propagate

5. **Restart your dev server**

### Verify Connection

After adding your IP, the connection should work. You'll see:
```
✅ MongoDB connected successfully
```

Instead of:
```
❌ MongoDB connection failed: ... IP that isn't whitelisted
```

## Local MongoDB Alternative

If you prefer to use local MongoDB instead:

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Update `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/intern-tracker
   ```
3. Comment out the MongoDB Atlas line
4. Restart your dev server
