# WalletConnect QR Code Test Checklist

## ✅ Setup Verification

### 1. Check Browser Console on Page Load
When you first load the page, you should see:
```
✅ Web3Modal initialized successfully
```

If you see an error instead, the modal won't work.

### 2. Check Project ID
The WalletConnect Project ID should be set:
- Environment variable: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Fallback: `dac575710eb8362c0d28c55d2dcf73dc`

### 3. Test the Connection Flow

**Step 1: Click "Connect Wallet (QR Code)"**
- Console should show: `🔗 Opening WalletConnect QR modal...`
- Console should show: `✅ WalletConnect modal open() called successfully`

**Step 2: Check if Modal Appears**
- After 1 second, console should show: `✅ Modal element found in DOM`
- A QR code modal should appear on screen

**Step 3: If Modal Doesn't Appear**
- After 5 seconds, you'll see an error message on the page
- Check console for any red error messages

## 🔍 Common Issues & Solutions

### Issue 1: "Web3Modal is not available"
**Solution:** Refresh the page. The modal needs to initialize on page load.

### Issue 2: Modal doesn't appear
**Possible causes:**
1. Project ID is invalid or missing
2. Network connectivity issues
3. Browser blocking popups/modals
4. CSS z-index issues (modal behind other elements)

**Check:**
- Open browser DevTools (F12)
- Go to Console tab
- Look for any red error messages
- Check if `w3m-modal` element exists in DOM (Elements tab)

### Issue 3: QR Code doesn't scan
**Solution:**
- Make sure you're using a WalletConnect-compatible wallet (MetaMask Mobile, Trust Wallet, etc.)
- Ensure your wallet app is updated to the latest version
- Try scanning from a different device if on mobile

## 🧪 Quick Test

1. Open the review page: `/verify/review`
2. Open browser console (F12)
3. Click "Connect Wallet (QR Code)"
4. Watch the console for the messages above
5. Check if QR code modal appears

## ✅ Success Indicators

- ✅ Console shows "Web3Modal initialized successfully" on page load
- ✅ Console shows "Modal element found in DOM" after clicking connect
- ✅ QR code modal appears on screen
- ✅ You can scan the QR code with your wallet
- ✅ Wallet connects successfully

## ❌ Failure Indicators

- ❌ Console shows "Error initializing Web3Modal"
- ❌ Console shows "Modal element not found in DOM"
- ❌ Error message appears on page after 5 seconds
- ❌ No QR code modal appears

