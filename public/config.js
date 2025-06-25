// Main configuration file for the upsell system
window.AppConfig = {
    // API Configuration
    API_URL: (function() {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        console.log('Detected hostname:', hostname, 'isLocalhost:', isLocalhost);
        return isLocalhost ? 'http://localhost:3000' : 'https://upsell-snowy.vercel.app';
    })(),
    
    // Stripe Configuration
    STRIPE_PUBLISHABLE_KEY: 'pk_test_51RdlIsPMvURrXJGvNX7UdYKOxdVRZhOL4tF30FEBtgwrSKjZOeTpGsEanJhTrWu6xbB2KwpUnQVlsecw3iehapiM00iLLooZV3',
    
    // Product Configuration
    PRODUCTS: {
        MAIN: 'prod_SYt7f28o0ZyHn2',
        CHECKOUT_UPSELL: 'prod_SYtASqEQNTXXDi',
        FINAL_UPSELL: 'prod_SYtBaNxeD562ly'
    },
    
    // Final Upsell Configuration
    FINAL_UPSELL_CONFIG: {
        USE_FREE_PRODUCT: false, // Set to true for free product, false for Stripe product
        FREE_PRODUCT: {
            product: {
                id: 'free_discovery_call',
                name: 'Free Discovery Call',
                description: 'Get a free 30-minute strategy session with our experts'
            },
            price: {
                amount: 0,
                formatted: 'FREE',
                currency: 'gbp'
            }
        }
    },
    
    // Webhook URLs
    WEBHOOKS: {
        CHECKOUT: 'https://hooks.zapier.com/hooks/catch/2299769/ub2fktg/',
        SUCCESS: 'https://hooks.zapier.com/hooks/catch/2299769/ub2fcwq/'
    },
    
    // Currency Settings
    CURRENCY: {
        CODE: 'gbp',
        SYMBOL: '£'
    },
    
    // UI Settings
    UI: {
        POPUP_DELAY: 2000, // ms delay before showing success page popup
        NOTIFICATION_DURATION: 5000, // ms duration for notifications
        CLEANUP_DELAY: 1000 // ms delay before cleaning localStorage
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        MAIN_PRODUCT: 'mainProduct',
        CUSTOMER_INFO: 'customerInfo',
        PAYMENT_SUCCESS: 'paymentSuccess',
        FINAL_UPSELL: 'finalUpsellPurchase',
        CUSTOMER_DATA: 'customerData'
    },
    
    // Helper methods
    getProductId: function(productType) {
        return this.PRODUCTS[productType.toUpperCase()] || null;
    },
    
    getFinalUpsellProduct: function() {
        return this.FINAL_UPSELL_CONFIG.USE_FREE_PRODUCT 
            ? this.FINAL_UPSELL_CONFIG.FREE_PRODUCT
            : { id: this.PRODUCTS.FINAL_UPSELL };
    },
    
    formatPrice: function(amountInCents) {
        return `${this.CURRENCY.SYMBOL}${(amountInCents / 100).toFixed(2)}`;
    },
    
    getApiUrl: function(endpoint) {
        return `${this.API_URL}${endpoint}`;
    }
}; 