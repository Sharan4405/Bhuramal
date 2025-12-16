# Razorpay Integration Setup Guide

## 📋 Prerequisites
- Razorpay account (test/live)
- Razorpay API keys (Key ID and Key Secret)
- Ngrok or public domain for webhook URL

## 🔧 Step 1: Environment Variables

Add these to your `.env` file:
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxx

# WhatsApp Business Number (for redirect after payment)
WHATSAPP_BUSINESS_NUMBER=919019942380
```

## 🌐 Step 2: Webhook Configuration

### For Development (using ngrok):
1. Start ngrok: `ngrok http 3000`
2. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### For Production:
Use your domain (e.g., `https://yourdomain.com`)

## 🔔 Step 3: Configure Razorpay Webhooks

1. **Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com/

2. **Navigate to Webhooks**
   - Settings → Webhooks → Add New Webhook

3. **Webhook Configuration**:
   ```
   Webhook URL: https://your-domain.com/payment/webhook
   
   Active Events:
   ✅ payment_link.paid
   ✅ payment_link.cancelled  
   ✅ payment_link.expired
   
   Secret: (Optional - leave blank for now)
   ```

4. **Save Webhook**
   - Click "Create Webhook"
   - Note down the Webhook ID for reference

## 🧪 Step 4: Test the Integration

### Test Payment Flow:
1. **Start the bot** and place an order
2. **Complete address input** → Payment link will be generated
3. **Click payment link** → Opens Razorpay payment page
4. **Test Payment**:
   ```
   Card Number: 4111 1111 1111 1111
   Expiry: Any future date (e.g., 12/25)
   CVV: 123
   Name: Test User
   ```
5. **Complete payment** → Should receive WhatsApp confirmation

### Verify Webhook:
1. **Check server logs** for webhook events:
   ```
   🔔 Razorpay webhook received: { event: 'payment_link.paid' }
   ✅ Order payment confirmed via webhook
   📱 WhatsApp payment confirmation sent successfully
   ```

2. **Check Razorpay Dashboard**:
   - Webhooks → Your webhook → Logs
   - Should show successful deliveries (200 status)

## 🐛 Troubleshooting

### Common Issues:

1. **Webhook not receiving events**:
   - Check ngrok is running and URL is correct
   - Verify webhook URL in Razorpay dashboard
   - Check server logs for incoming requests

2. **WhatsApp notification not sent**:
   - Check WhatsApp API credentials
   - Verify phone number format (+91XXXXXXXXXX)
   - Check console logs for errors

3. **Payment callback fails**:
   - Ensure `/payment/callback` endpoint is accessible
   - Check if order exists in database
   - Verify payment link ID matches order

### Debug Commands:
```bash
# Check webhook endpoint
curl -X POST https://your-domain.com/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test","payload":{}}'

# Check if server is running
curl https://your-domain.com/health
```

## 📊 Production Checklist

- [ ] Switch to live Razorpay keys
- [ ] Update webhook URL to production domain
- [ ] Test with real payment (small amount)
- [ ] Monitor webhook delivery logs
- [ ] Set up error alerting for failed payments
- [ ] Configure proper SSL certificate

## 🔄 Flow Summary

```
Customer Orders → Address Input → Payment Link Generated
       ↓
Payment Link Clicked → Razorpay Payment Page → Payment Success
       ↓
Razorpay Webhook → Update Order Status → WhatsApp Confirmation
       ↓
Customer Redirected → Success Page → "Open WhatsApp" Button
```

## 📞 Support

If issues persist:
1. Check Razorpay webhook logs in dashboard
2. Review server console for error messages  
3. Verify WhatsApp API is working with test messages
4. Test payment flow with Razorpay test cards

---

**Note**: Keep your Razorpay keys secure and never commit them to version control.
