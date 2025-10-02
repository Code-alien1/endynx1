# Mobile Backend Connection Troubleshooting Guide

## Problem
Mobile phone cannot connect to Django backend server, showing "Network Error" during login attempts.

## Quick Fix Steps

### 1. Start Django Server Correctly
```bash
cd Backend
python manage.py runserver 0.0.0.0:8000
```
**Important**: Use `0.0.0.0:8000` NOT `127.0.0.1:8000` or `localhost:8000`

### 2. Find Your Computer's IP Address
```bash
# Windows
ipconfig

# Look for "Wireless LAN adapter Wi-Fi" or "Ethernet adapter"
# Find the IPv4 Address (e.g., 192.168.237.107)
```

### 3. Update API Configuration (if needed)
The app is configured to use `192.168.237.107:8000`. If your IP changed:
- Edit `Fronted/services/api.ts`
- Update the `mobileIP` variable on line 16

### 4. Test Connectivity
Use the ConnectionTest component:
```tsx
import { ConnectionTest } from '../components/ConnectionTest';
// Add <ConnectionTest /> to your app temporarily
```

### 5. Check Firewall Settings
- Windows Defender Firewall might block port 8000
- Add exception for Python/Django on port 8000
- Or temporarily disable firewall for testing

## Common Issues & Solutions

### Issue: "Connection Refused"
**Cause**: Django server not running or not bound to 0.0.0.0
**Solution**: 
```bash
python manage.py runserver 0.0.0.0:8000
```

### Issue: "Network Request Failed"
**Cause**: Phone and computer on different networks
**Solution**: 
- Ensure both devices on same WiFi network
- Check if computer has multiple network adapters
- Use correct IP address for the shared network

### Issue: "Timeout"
**Cause**: Firewall blocking connection
**Solution**:
1. Windows: Add firewall exception for port 8000
2. Router: Check if client isolation is enabled
3. Antivirus: Temporarily disable to test

### Issue: "HTTP 404"
**Cause**: Wrong API endpoint
**Solution**: Verify endpoints exist:
- `/api/users/health/` - Health check
- `/api/users/login/` - Login endpoint

## Network Configuration Details

### Current Setup
- Mobile Network IP: `192.168.237.107`
- Backend Server: `0.0.0.0:8000`
- API Base URL: `http://192.168.237.107:8000/api`

### Platform-Specific URLs
- **Physical Android/iOS**: `http://192.168.237.107:8000/api`
- **Android Emulator**: `http://10.0.2.2:8000/api`
- **Web Browser**: `http://localhost:8000/api`

## Testing Commands

### Test from Computer
```bash
curl http://192.168.237.107:8000/api/users/health/
```

### Test from Mobile Browser
Navigate to: `http://192.168.237.107:8000/api/users/health/`
Should return: `{"status": "healthy", "message": "Backend server is running"}`

## Debug Logs
The app now includes detailed logging. Check console for:
- API Base URL being used
- Platform detection (iOS/Android/Web)
- Execution environment (storeClient/bareWorkflow)
- Detailed error messages with status codes

## If Still Not Working

1. **Check IP Address**: Your computer's IP might have changed
2. **Network Reset**: Restart router and reconnect devices
3. **Alternative IP**: Try other network interfaces (Ethernet vs WiFi)
4. **Mobile Hotspot**: Test using phone's hotspot as network
5. **Port Change**: Try different port (8001, 8080) if 8000 is blocked

## Success Indicators
- Health check returns HTTP 200
- Console shows "Login successful" 
- No "Network Error" messages
- API calls complete without timeout
