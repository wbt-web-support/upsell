// JavaScript for success.html - Success page with popup upsell
let stripe = null;
let finalUpsellProduct = null;
let customerPaymentMethod = null;
let customerId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Stripe with publishable key
    stripe = Stripe(AppConfig.STRIPE_PUBLISHABLE_KEY);
    
    await loadPaymentDetails();
    await loadFinalUpsellProduct();
    showOrderDetails();
    
    // Show inline upsell after a delay
    setTimeout(showInlineUpsell, 1000);
    
    // Setup popup outside click handler
    const popup = document.getElementById('upsell-popup');
    if (popup) {
        popup.addEventListener('click', function(e) {
            if (e.target === this) {
                closePopup();
            }
        });
    }
});

async function loadPaymentDetails() {
    try {
        const paymentData = localStorage.getItem(AppConfig.STORAGE_KEYS.PAYMENT_SUCCESS);
        if (!paymentData) {
            window.location.href = 'index.html';
            return;
        }
        
        const { paymentIntentId } = JSON.parse(paymentData);
        
        const response = await fetch(AppConfig.getApiUrl('/api/confirm-payment'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentIntentId })
        });
        
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading payment details:', data.error);
            return;
        }
        
        customerPaymentMethod = data.paymentIntent.payment_method_id;
        customerId = data.paymentIntent.customer_id;
        
        console.log('Payment details loaded:', {
            paymentMethod: customerPaymentMethod,
            customer: customerId
        });
        
    } catch (error) {
        console.error('Error loading payment details:', error);
    }
}

async function loadFinalUpsellProduct() {
    try {
        if (AppConfig.FINAL_UPSELL_CONFIG.USE_FREE_PRODUCT) {
            finalUpsellProduct = AppConfig.FINAL_UPSELL_CONFIG.FREE_PRODUCT;
            updatePopupContent(finalUpsellProduct);
            updateInlineContent(finalUpsellProduct);
        } else {
            const response = await fetch(AppConfig.getApiUrl(`/api/get-product?product_id=${AppConfig.getProductId('FINAL_UPSELL')}`));
            const data = await response.json();
            
            if (!data.error) {
                finalUpsellProduct = data;
                updatePopupContent(data);
                updateInlineContent(data);
            }
        }
        
        // If inline upsell is currently showing loading, switch to content
        const upsellSection = document.getElementById('inline-upsell');
        const loadingSection = document.getElementById('upsell-loading');
        if (upsellSection.style.display === 'block' && loadingSection.style.display === 'block') {
            showUpsellContent();
        }
    } catch (error) {
        console.error('Error loading final upsell product:', error);
        // If there's an error and we're showing loading, hide the section
        const upsellSection = document.getElementById('inline-upsell');
        const loadingSection = document.getElementById('upsell-loading');
        if (upsellSection.style.display === 'block' && loadingSection.style.display === 'block') {
            skipUpsell();
        }
    }
}

function updatePopupContent(product) {
    // Update popup content (for backward compatibility)
    document.getElementById('popup-product-name').textContent = product.product.name;
    document.getElementById('popup-product-description').textContent = 
        product.product.description || 'Special final offer just for you!';
    document.getElementById('popup-product-price').textContent = product.price.formatted;
}

function updateInlineContent(product) {
    // Update inline upsell content
    document.getElementById('inline-product-name').textContent = product.product.name;
    document.getElementById('inline-product-description').textContent = 
        product.product.description || 'Special final offer just for you!';
    document.getElementById('inline-product-price').textContent = product.price.formatted;
}

function showOrderDetails() {
    const paymentData = localStorage.getItem(AppConfig.STORAGE_KEYS.PAYMENT_SUCCESS);
    const mainProduct = localStorage.getItem(AppConfig.STORAGE_KEYS.MAIN_PRODUCT);
    
    if (!paymentData || !mainProduct) return;
    
    const { includedUpsell } = JSON.parse(paymentData);
    const mainProductData = JSON.parse(mainProduct);
    
    let html = `
        <div class="order-item">
            <span>${mainProductData.product.name}</span>
            <span>${mainProductData.price.formatted}</span>
        </div>
    `;
    
    if (includedUpsell) {
        html += `
            <div class="order-item">
                <span>Advanced Bundle</span>
                <span>Included</span>
            </div>
        `;
    }
    
    document.getElementById('purchased-items').innerHTML = html;
}

function showInlineUpsell() {
    // Show inline upsell section with loading state
    document.getElementById('inline-upsell').style.display = 'block';
    document.getElementById('upsell-loading').style.display = 'block';
    document.getElementById('upsell-content').style.display = 'none';
    
    // Hide continue button until decision is made
    document.getElementById('continue-btn').style.display = 'none';
    
    // If product is already loaded, show content immediately
    if (finalUpsellProduct) {
        showUpsellContent();
    }
}

function showUpsellContent() {
    // Hide loading and show content
    document.getElementById('upsell-loading').style.display = 'none';
    document.getElementById('upsell-content').style.display = 'block';
    
    // Setup inline buy button
    const buyButton = document.getElementById('inline-buy-btn');
    if (!buyButton.hasAttribute('data-listener-added')) {
        buyButton.addEventListener('click', handleInlinePurchase);
        buyButton.setAttribute('data-listener-added', 'true');
    }
}

function showUpsellPopup() {
    if (!finalUpsellProduct) return;
    
    document.getElementById('upsell-popup').style.display = 'flex';
    
    const buyButton = document.getElementById('popup-buy-btn');
    if (!buyButton.hasAttribute('data-listener-added')) {
        buyButton.addEventListener('click', handlePopupPurchase);
        buyButton.setAttribute('data-listener-added', 'true');
    }
}

function closePopup() {
    document.getElementById('upsell-popup').style.display = 'none';
}

function skipUpsell() {
    // Redirect directly to final success page
    window.location.href = 'final-success.html';
}

function showInlineError(message) {
    const errorDiv = document.getElementById('inline-error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    // Scroll error into view
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideInlineError() {
    const errorDiv = document.getElementById('inline-error-message');
    errorDiv.style.display = 'none';
}

async function handleInlinePurchase() {
    if (!finalUpsellProduct) {
        showInlineError('Product not loaded. Please try again.');
        return;
    }
    
    const buyButton = document.getElementById('inline-buy-btn');
    hideInlineError();
    setButtonLoading(buyButton, true);
    
    try {
        const customerInfo = localStorage.getItem(AppConfig.STORAGE_KEYS.CUSTOMER_INFO);
        const customerData = customerInfo ? JSON.parse(customerInfo) : null;
        
        // Handle free products
        if (finalUpsellProduct.price.amount === 0) {
            await handleFreeProduct(customerData);
            return;
        }
        
        // Handle paid products
        await handlePaidProduct(customerData);
        
    } catch (error) {
        console.error('Inline purchase error:', error);
        showInlineError('Payment failed: ' + error.message);
    } finally {
        setButtonLoading(buyButton, false);
    }
}

async function handlePopupPurchase() {
    if (!finalUpsellProduct) {
        alert('Product not loaded. Please try again.');
        return;
    }
    
    const buyButton = document.getElementById('popup-buy-btn');
    setButtonLoading(buyButton, true);
    
    try {
        const customerInfo = localStorage.getItem(AppConfig.STORAGE_KEYS.CUSTOMER_INFO);
        const customerData = customerInfo ? JSON.parse(customerInfo) : null;
        
        // Handle free products
        if (finalUpsellProduct.price.amount === 0) {
            await handleFreeProduct(customerData);
            return;
        }
        
        // Handle paid products
        await handlePaidProduct(customerData);
        
    } catch (error) {
        console.error('Popup purchase error:', error);
        alert('Payment failed: ' + error.message);
    } finally {
        setButtonLoading(buyButton, false);
    }
}

async function handleFreeProduct(customerData) {
    console.log('Free product detected, skipping payment processing');
    
    if (customerData) {
        const upsellData = {
            paymentIntentId: 'free_product',
            product: {
                id: finalUpsellProduct.product.id,
                name: finalUpsellProduct.product.name,
                price: finalUpsellProduct.price.amount,
                priceFormatted: finalUpsellProduct.price.formatted
            },
            totalOrderValue: 0,
            totalOrderValueFormatted: 'FREE'
        };
        await sendSuccessWebhook(customerData, upsellData);
    }
    
    localStorage.setItem(AppConfig.STORAGE_KEYS.FINAL_UPSELL, JSON.stringify({
        paymentIntentId: 'free_product',
        productId: finalUpsellProduct.product.id,
        amount: finalUpsellProduct.price.amount,
        type: 'free'
    }));
    
    window.location.href = 'final-success.html';
}

async function handlePaidProduct(customerData) {
    if (!customerId || !customerPaymentMethod) {
        throw new Error('Customer or payment method not found. Please try again.');
    }
    
    // Get original purchase information for comprehensive metadata
    const mainProduct = localStorage.getItem(AppConfig.STORAGE_KEYS.MAIN_PRODUCT);
    const paymentSuccess = localStorage.getItem(AppConfig.STORAGE_KEYS.PAYMENT_SUCCESS);
    
    let originalProductId = null;
    let checkoutUpsellId = null;
    
    if (mainProduct) {
        const main = JSON.parse(mainProduct);
        originalProductId = main.product.id;
    }
    
    if (paymentSuccess) {
        const payment = JSON.parse(paymentSuccess);
        if (payment.includedUpsell) {
            checkoutUpsellId = AppConfig.getProductId('CHECKOUT_UPSELL');
        }
    }

    const response = await fetch(AppConfig.getApiUrl('/api/create-payment-intent'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: finalUpsellProduct.price.amount,
            currency: AppConfig.CURRENCY.CODE,
            customer: customerId,
            metadata: {
                // Final upsell product info
                final_upsell: finalUpsellProduct.product.id,
                product_name: finalUpsellProduct.product.name,
                
                // Customer information (same as checkout)
                customer_name: customerData ? `${customerData.firstName} ${customerData.lastName}` : '',
                customer_email: customerData ? customerData.email : '',
                customer_phone: customerData ? customerData.phone : '',
                
                // Original purchase context
                main_product: originalProductId,
                checkout_upsell: checkoutUpsellId,
                purchase_flow: 'success_page_upsell',
                
                // Transaction context
                original_payment_intent: paymentSuccess ? JSON.parse(paymentSuccess).paymentIntentId : null
            }
        })
    });
    
    const responseData = await response.json();
    
    if (!response.ok || responseData.error) {
        throw new Error(responseData.error || 'Failed to create payment intent');
    }
    
    const { clientSecret } = responseData;
    
    const paymentMethodId = typeof customerPaymentMethod === 'string' 
        ? customerPaymentMethod 
        : customerPaymentMethod.id;
    
    const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId
    });
    
    if (result.error) {
        throw new Error(result.error.message);
    }
    
    // Success - send webhook and redirect
    if (customerData) {
        const totalOrderValue = calculateTotalOrderValue();
        const upsellData = {
            paymentIntentId: result.paymentIntent.id,
            product: {
                id: finalUpsellProduct.product.id,
                name: finalUpsellProduct.product.name,
                price: finalUpsellProduct.price.amount,
                priceFormatted: finalUpsellProduct.price.formatted
            },
            totalOrderValue: totalOrderValue,
            totalOrderValueFormatted: AppConfig.formatPrice(totalOrderValue)
        };
        
        await sendSuccessWebhook(customerData, upsellData);
    }
    
    localStorage.setItem(AppConfig.STORAGE_KEYS.FINAL_UPSELL, JSON.stringify({
        product: finalUpsellProduct.product,
        price: finalUpsellProduct.price,
        type: 'paid',
        paymentIntent: result.paymentIntent.id
    }));
    
    window.location.href = 'final-success.html';
}

function calculateTotalOrderValue() {
    let total = finalUpsellProduct.price.amount;
    
    const paymentSuccess = localStorage.getItem(AppConfig.STORAGE_KEYS.PAYMENT_SUCCESS);
    const mainProduct = localStorage.getItem(AppConfig.STORAGE_KEYS.MAIN_PRODUCT);
    
    if (paymentSuccess && mainProduct) {
        const paymentData = JSON.parse(paymentSuccess);
        const main = JSON.parse(mainProduct);
        total += main.price.amount;
        
        if (paymentData.includedUpsell) {
            total += 2000; // Should be actual checkout upsell amount
        }
    }
    
    return total;
}

async function sendSuccessWebhook(customerData, upsellData) {
    try {
        const webhookData = {
            event: 'success_upsell_accepted',
            timestamp: new Date().toISOString(),
            customer: {
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                fullName: `${customerData.firstName} ${customerData.lastName}`,
                email: customerData.email,
                phone: customerData.phone
            },
            upsell: {
                paymentIntentId: upsellData.paymentIntentId,
                product: upsellData.product,
                totalOrderValue: upsellData.totalOrderValue,
                totalOrderValueFormatted: upsellData.totalOrderValueFormatted,
                currency: 'GBP'
            }
        };
        
        console.log('Sending success webhook:', webhookData);
        
        const response = await fetch(AppConfig.WEBHOOKS.SUCCESS, {
            method: 'POST',
            body: JSON.stringify(webhookData)
        });
        
        if (response.ok) {
            console.log('Success webhook sent successfully');
        } else {
            console.warn('Success webhook failed:', response.status);
        }
    } catch (error) {
        console.error('Error sending success webhook:', error);
    }
} 