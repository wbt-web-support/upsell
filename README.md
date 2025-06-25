# 3-Step Upsell Flow with Next.js & Stripe

A complete 3-step upsell system using Next.js API routes and vanilla HTML/CSS/JS frontend, designed for easy integration with WordPress.

## 🚀 Features

- **Step 1**: Main product checkout via Stripe Checkout
- **Step 2**: First upsell offer using saved payment method (no card entry required)
- **Step 3**: Final upsell offer with off-session payment
- Modern, responsive design with smooth animations
- Built with vanilla HTML/CSS/JS for WordPress compatibility
- Secure payment processing with Stripe
- Real-time countdown timers for urgency
- Mobile-optimized design

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd upsell
npm install
```

### 2. Configure Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Copy `.env.local.example` to `.env.local`
4. Add your Stripe keys to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the main product page.

## 📁 Project Structure

```
upsell/
├── app/
│   └── api/
│       ├── create-checkout-session/route.ts  # Initial checkout
│       ├── upsell-payment/route.ts          # Upsell payments
│       └── get-session/route.ts             # Session retrieval
├── public/
│   ├── index.html          # Step 1: Main product page
│   ├── success.html        # Step 2: First upsell offer
│   ├── upsell2.html        # Step 3: Final upsell offer
│   ├── final-success.html  # Final success page
│   ├── styles.css          # Shared CSS styles
│   └── script.js           # Shared JavaScript functions
└── ...
```

## 🔄 Flow Explanation

### Step 1: Main Product Purchase
- Customer visits `index.html`
- Clicks "Get Instant Access" → Redirects to Stripe Checkout
- Payment processed with `setup_future_usage: 'off_session'`
- Redirects to `success.html` with session ID

### Step 2: First Upsell
- `success.html` loads customer data from Stripe session
- Shows countdown timer and upsell offer
- If accepted: Charges using saved payment method → Redirects to `upsell2.html`
- If declined: Redirects to `final-success.html`

### Step 3: Final Upsell
- `upsell2.html` shows final exclusive offer
- If accepted: Charges using saved payment method → Final success
- If declined or expired: Final success page

## 🎨 Frontend Files (WordPress Ready)

All frontend files in the `public/` directory are built with vanilla HTML/CSS/JS:

- **index.html**: Main product landing page
- **success.html**: Payment success + first upsell
- **upsell2.html**: Final upsell offer
- **final-success.html**: Order completion
- **styles.css**: Modern, responsive styling
- **script.js**: Payment handling & utilities

### WordPress Integration

To integrate with WordPress:

1. Copy files from `public/` to your WordPress theme/child theme
2. Update API endpoints in `script.js` to match your domain
3. Customize styling to match your theme
4. Add the HTML content to WordPress pages/posts

## 🔧 API Routes

### POST `/api/create-checkout-session`
Creates initial Stripe checkout session with future payment setup.

```javascript
{
  "productName": "Premium Course",
  "amount": 2999  // Amount in cents
}
```

### POST `/api/upsell-payment`
Processes upsell payments using saved payment method.

```javascript
{
  "customerId": "cus_xxx",
  "amount": 4700,
  "productName": "Advanced Bundle",
  "step": 2
}
```

### GET `/api/get-session?session_id=xxx`
Retrieves checkout session details after successful payment.

## 🎨 Customization

### Styling
- Edit `public/styles.css` for visual customization
- Modify colors, fonts, and layout as needed
- All styles are responsive and mobile-optimized

### Products & Pricing
- Update product names and prices in HTML files
- Modify API routes for different pricing tiers
- Customize success messages and offers

### Payment Flow
- Adjust countdown timers in HTML files
- Modify redirect URLs in API routes
- Customize payment success handling

## 🔒 Security & Production

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Webhooks (Optional)
For production, consider implementing webhooks to handle:
- Payment confirmations
- Failed payments
- Subscription events

### HTTPS
Ensure your production environment uses HTTPS for secure payments.

## 📱 Responsive Design

The frontend is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🎯 Marketing Features

- Countdown timers for urgency
- Social proof testimonials
- Value stacking presentation
- Mobile-optimized checkout
- Smooth animations and transitions
- Professional gradient designs

## 🐛 Troubleshooting

### Common Issues

1. **Stripe payments not working**
   - Check API keys in `.env.local`
   - Ensure webhook endpoints are correct
   - Verify test mode vs live mode

2. **Upsell payments failing**
   - Confirm customer has saved payment method
   - Check off_session capability
   - Verify customer ID is passed correctly

3. **Redirects not working**
   - Update `NEXT_PUBLIC_BASE_URL` in environment
   - Check success/cancel URLs in checkout session

## 📞 Support

For issues or questions:
- Check the Stripe documentation
- Review API logs in Stripe Dashboard
- Test with Stripe's test card numbers

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Configure build command: `npm run build`
- Set start command: `npm start`

---

**Ready to boost your conversions with this powerful 3-step upsell system!** 🎉
