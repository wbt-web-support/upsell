// JavaScript for checkout.html - Checkout page with payment processing
let stripe;
let cardElement;
let elements;
let mainProduct = null;
let upsellProduct = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Stripe with publishable key
    stripe = Stripe(AppConfig.STRIPE_PUBLISHABLE_KEY);
    
    await loadProducts();
    setupPaymentForm();
    initializeCheckout();
});

async function loadProducts() {
    try {
        // Load main product from localStorage
        const mainProductData = localStorage.getItem(AppConfig.STORAGE_KEYS.MAIN_PRODUCT);
        if (!mainProductData) {
            showNotification('No product selected. Redirecting to main page...', 'warning');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        
        mainProduct = JSON.parse(mainProductData);
        
        // Load upsell product
        const upsellResponse = await fetch(AppConfig.getApiUrl(`/api/get-product?product_id=${AppConfig.getProductId('CHECKOUT_UPSELL')}`));
        const upsellData = await upsellResponse.json();
        
        if (upsellData.error) {
            console.error('Error loading upsell product:', upsellData.error);
            document.querySelector('.upsell-option').style.display = 'none';
        } else {
            upsellProduct = upsellData;
        }
        
        updateOrderSummary();
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function setupPaymentForm() {
    elements = stripe.elements();
    
    cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
        },
    });
    
    cardElement.mount('#card-element');
    
    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });
}

function updateOrderSummary() {
    if (!mainProduct) return;
    
    document.getElementById('main-product-name').textContent = mainProduct.product.name;
    document.getElementById('main-product-price').textContent = mainProduct.price.formatted;
    
    if (upsellProduct) {
        document.getElementById('upsell-product-name').textContent = upsellProduct.product.name;
        document.getElementById('upsell-product-price').textContent = upsellProduct.price.formatted;
    }
    
    calculateTotal();
}

function calculateTotal() {
    if (!mainProduct) return;
    
    let total = mainProduct.price.amount;
    const addUpsell = document.getElementById('add-upsell').checked;
    
    if (addUpsell && upsellProduct) {
        total += upsellProduct.price.amount;
    }
    
    document.getElementById('total-amount').textContent = AppConfig.formatPrice(total);
}

function initializeCheckout() {
    // Update total when checkbox changes
    document.getElementById('add-upsell').addEventListener('change', calculateTotal);
    
    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', handleSubmit);
    
    // Add real-time validation for customer form
    setupCustomerFormValidation();
}

function setupCustomerFormValidation() {
    const requiredFields = ['first-name', 'last-name', 'email', 'phone'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    if (!value) {
        field.style.borderColor = '#e53e3e';
        return false;
    }
    
    // Email validation
    if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            field.style.borderColor = '#e53e3e';
            return false;
        }
    }
    
    // Phone validation (basic)
    if (field.type === 'tel') {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            field.style.borderColor = '#e53e3e';
            return false;
        }
    }
    
    field.style.borderColor = '#38a169';
    return true;
}

function clearFieldError(event) {
    event.target.style.borderColor = '#ddd';
}

function validateCustomerForm() {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!firstName || !lastName || !email || !phone) {
        showNotification('Please fill in all required customer information fields.', 'warning');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return false;
    }
    
    // Phone validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid phone number.', 'error');
        return false;
    }
    
    return true;
}

function getCustomerData() {
    return {
        firstName: document.getElementById('first-name').value.trim(),
        lastName: document.getElementById('last-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };
}

function formatPrice(amountInCents) {
    return AppConfig.formatPrice(amountInCents);
}

async function sendCheckoutWebhook(customerData, orderData) {
    try {
        const webhookData = {
            event: 'checkout_completed',
            timestamp: new Date().toISOString(),
            customer: {
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                fullName: `${customerData.firstName} ${customerData.lastName}`,
                email: customerData.email,
                phone: customerData.phone
            },
            order: orderData
        };
        
        console.log('Sending checkout webhook:', webhookData);
        
        const response = await fetch(AppConfig.WEBHOOKS.CHECKOUT, {
            method: 'POST',
            body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
            console.log('Checkout webhook sent successfully');
        } else {
            console.warn('Checkout webhook failed:', response.status);
        }
    } catch (error) {
        console.error('Error sending checkout webhook:', error);
        // Don't block the user flow if webhook fails
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    
    // Validate customer information first
    if (!validateCustomerForm()) {
        return;
    }
    
    const submitButton = document.getElementById('submit-payment');
    setButtonLoading(submitButton, true);
    
    try {
        // Calculate final amount
        let amount = mainProduct.price.amount;
        const addUpsell = document.getElementById('add-upsell').checked;
        
        if (addUpsell && upsellProduct) {
            amount += upsellProduct.price.amount;
        }
        
        // Get customer data
        const customerData = getCustomerData();
        
        // Create payment intent with customer information
        const response = await fetch(AppConfig.getApiUrl('/api/create-payment-intent'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                currency: AppConfig.CURRENCY.CODE,
                customerInfo: customerData,
                metadata: {
                    main_product: mainProduct.product.id,
                    upsell_product: addUpsell && upsellProduct ? upsellProduct.product.id : null,
                    customer_name: `${customerData.firstName} ${customerData.lastName}`,
                    customer_email: customerData.email,
                    customer_phone: customerData.phone
                }
            })
        });
        
        const responseData = await response.json();
        
        if (!response.ok || responseData.error) {
            throw new Error(responseData.error || 'Failed to create payment intent');
        }
        
        const { clientSecret, paymentIntentId } = responseData;
        
        // Confirm payment with customer information
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: `${customerData.firstName} ${customerData.lastName}`,
                    email: customerData.email,
                    phone: customerData.phone,
                }
            }
        });
        
        if (result.error) {
            document.getElementById('card-errors').textContent = result.error.message;
        } else {
            // Payment succeeded - store customer data for future use
            localStorage.setItem(AppConfig.STORAGE_KEYS.CUSTOMER_INFO, JSON.stringify(customerData));
            localStorage.setItem(AppConfig.STORAGE_KEYS.PAYMENT_SUCCESS, JSON.stringify({
                paymentIntentId: paymentIntentId,
                includedUpsell: addUpsell
            }));
            
            // Prepare order data for webhook
            const orderData = {
                paymentIntentId: paymentIntentId,
                mainProduct: {
                    id: mainProduct.product.id,
                    name: mainProduct.product.name,
                    price: mainProduct.price.amount,
                    priceFormatted: formatPrice(mainProduct.price.amount)
                },
                upsellProduct: (addUpsell && upsellProduct) ? {
                    id: upsellProduct.product.id,
                    name: upsellProduct.product.name,
                    price: upsellProduct.price.amount,
                    priceFormatted: formatPrice(upsellProduct.price.amount)
                } : null,
                totalAmount: amount,
                totalAmountFormatted: formatPrice(amount)
            };
            
            // Send checkout webhook
            await sendCheckoutWebhook(customerData, orderData);
            
            window.location.href = 'success.html';
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        document.getElementById('card-errors').textContent = 'Payment failed: ' + error.message;
    } finally {
        setButtonLoading(submitButton, false);
    }
} 