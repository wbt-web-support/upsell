// JavaScript for checkout.html - Checkout page with payment processing
let stripe;
let cardNumberElement;
let cardExpiryElement;
let cardCvcElement;
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
            showPaymentError('No product selected. Redirecting to main page...');
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
    
    const elementStyles = {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
    };
    
    // Create individual card elements
    cardNumberElement = elements.create('cardNumber', {
        style: elementStyles,
        placeholder: '1234 1234 1234 1234'
    });
    
    cardExpiryElement = elements.create('cardExpiry', {
        style: elementStyles,
        placeholder: 'MM / YY'
    });
    
    cardCvcElement = elements.create('cardCvc', {
        style: elementStyles,
        placeholder: 'CVV'
    });
    
    // Mount elements to their containers
    cardNumberElement.mount('#card-number-element');
    cardExpiryElement.mount('#card-expiry-element');
    cardCvcElement.mount('#card-cvc-element');
    
    // Add change event listeners for error handling and auto-tabbing
    cardNumberElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
        
        // Auto-tab to expiry field when card number is complete
        if (event.complete) {
            cardExpiryElement.focus();
        }
    });
    
    cardExpiryElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
        
        // Auto-tab to CVC field when expiry is complete
        if (event.complete) {
            cardCvcElement.focus();
        }
    });
    
    cardCvcElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
        
        // When CVC is complete, you could focus the submit button if desired
        if (event.complete) {
            // Optional: Focus the submit button when all card fields are complete
            // document.getElementById('submit-payment').focus();
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
        
        // Add touched class when user interacts with field
        field.addEventListener('focus', function() {
            this.classList.add('touched');
        });
        
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Mark as touched if not already
    field.classList.add('touched');
    
    if (!value) {
        return false;
    }
    
    // Email validation
    if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return false;
        }
    }
    
    // Phone validation (basic)
    if (field.type === 'tel') {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            return false;
        }
    }
    
    return true;
}

function clearFieldError(event) {
    // CSS handles the visual feedback now through :valid/:invalid classes
    // No need to manually set border colors
}

function validateCustomerForm() {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!firstName || !lastName || !email || !phone) {
        showCustomerError('Please fill in all required customer information fields.');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showCustomerError('Please enter a valid email address.');
        return false;
    }
    
    // Phone validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
        showCustomerError('Please enter a valid phone number.');
        return false;
    }
    
    hideCustomerError();
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

function showCustomerError(message) {
    const errorDiv = document.getElementById('customer-error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideCustomerError() {
    const errorDiv = document.getElementById('customer-error-message');
    errorDiv.style.display = 'none';
}

function showPaymentError(message) {
    const errorDiv = document.getElementById('payment-error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hidePaymentError() {
    const errorDiv = document.getElementById('payment-error-message');
    errorDiv.style.display = 'none';
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
                phone: customerData.phone,
                tag: 'checkout'
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
    hidePaymentError();
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
                card: cardNumberElement,
                billing_details: {
                    name: `${customerData.firstName} ${customerData.lastName}`,
                    email: customerData.email,
                    phone: customerData.phone,
                }
            }
        });
        
        if (result.error) {
            showPaymentError('Payment failed: ' + result.error.message);
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
            
            window.location.href = '/upsell-success.html';
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        showPaymentError('Payment failed: ' + error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
} 