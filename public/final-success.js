// JavaScript for final-success.html - Final success page with complete summary
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const step = urlParams.get('step');
    
    updateSuccessMessage(step);
    displayActualPurchaseSummary();
    
    // Clean up localStorage after showing summary
    setTimeout(() => {
        cleanupLocalStorage();
    }, AppConfig.UI.CLEANUP_DELAY);
});

function updateSuccessMessage(step) {
    const title = document.getElementById('success-title');
    const message = document.getElementById('success-message');
    
    switch(step) {
        case 'skipped':
            title.textContent = 'Thank You!';
            message.textContent = 'You have access to your course.';
            break;
        case 'complete':
            title.textContent = 'Amazing!';
            message.textContent = 'You have access to everything.';
            break;
        case 'expired':
            title.textContent = 'No Problem!';
            message.textContent = 'You still have your courses.';
            break;
        default:
            title.textContent = 'All Done!';
            message.textContent = 'Your order is complete.';
    }
}

function displayActualPurchaseSummary() {
    const summaryItems = document.getElementById('summary-items');
    const totalAmount = document.getElementById('total-amount');
    const customerDetails = document.getElementById('customer-details');
    
    // Display customer information
    displayCustomerInfo(customerDetails);
    
    let html = '';
    let totalCents = 0;
    let itemCount = 0;
    
    // Get main product data
    const mainProductData = localStorage.getItem(AppConfig.STORAGE_KEYS.MAIN_PRODUCT);
    if (mainProductData) {
        const mainProduct = JSON.parse(mainProductData);
        html += createOrderItemHtml(mainProduct.product.name, mainProduct.price.formatted);
        totalCents += mainProduct.price.amount;
        itemCount++;
    }
    
    // Check if upsell was included in checkout
    const paymentData = localStorage.getItem(AppConfig.STORAGE_KEYS.PAYMENT_SUCCESS);
    if (paymentData) {
        const payment = JSON.parse(paymentData);
        if (payment.includedUpsell) {
            fetchAndDisplayUpsell().then(upsellData => {
                if (upsellData) {
                    const upsellHtml = createOrderItemHtml(upsellData.product.name, upsellData.price.formatted);
                    summaryItems.insertAdjacentHTML('beforeend', upsellHtml);
                    totalCents += upsellData.price.amount;
                    updateTotal(totalCents, itemCount + 1);
                }
            });
        }
    }
    
    // Check for final upsell purchase
    const finalUpsellData = localStorage.getItem(AppConfig.STORAGE_KEYS.FINAL_UPSELL);
    if (finalUpsellData) {
        const finalUpsell = JSON.parse(finalUpsellData);
        const priceDisplay = finalUpsell.price && finalUpsell.price.amount === 0 ? 'FREE' : 
                           finalUpsell.price ? finalUpsell.price.formatted : 'Included';
        
        html += createOrderItemHtml(finalUpsell.product.name, priceDisplay);
        
        if (finalUpsell.price && finalUpsell.price.amount > 0) {
            totalCents += finalUpsell.price.amount;
        }
        itemCount++;
    }
    
    // Display items
    summaryItems.innerHTML = html;
    
    // Update total
    updateTotal(totalCents, itemCount);
}

function displayCustomerInfo(customerDetails) {
    const customerInfo = localStorage.getItem(AppConfig.STORAGE_KEYS.CUSTOMER_INFO);
    if (customerInfo) {
        const customer = JSON.parse(customerInfo);
        customerDetails.innerHTML = `
            <div class="customer-info-display">
                <h4>Customer Details:</h4>
                <p><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</p>
                <p><strong>Email:</strong> ${customer.email}</p>
                <p><strong>Phone:</strong> ${customer.phone}</p>
            </div>
        `;
    }
}

function createOrderItemHtml(name, price) {
    return `
        <div class="summary-item">
            <span>${name}</span>
            <span>${price}</span>
        </div>
    `;
}

function updateTotal(totalCents, itemCount) {
    const totalAmount = document.getElementById('total-amount');
    const totalFormatted = AppConfig.formatPrice(totalCents);
    
    totalAmount.innerHTML = `
        <div class="total-row">
            <span><strong>Total (${itemCount} item${itemCount !== 1 ? 's' : ''}):</strong></span>
            <span><strong>${totalFormatted}</strong></span>
        </div>
    `;
}

async function fetchAndDisplayUpsell() {
    try {
        const response = await fetch(AppConfig.getApiUrl(`/api/get-product?product_id=${AppConfig.getProductId('CHECKOUT_UPSELL')}`));
        const data = await response.json();
        
        if (!data.error) {
            return data;
        }
    } catch (error) {
        console.error('Error fetching upsell product:', error);
    }
    
    return null;
}

function cleanupLocalStorage() {
    const keysToClean = [
        AppConfig.STORAGE_KEYS.CUSTOMER_DATA,
        AppConfig.STORAGE_KEYS.PAYMENT_SUCCESS,
        AppConfig.STORAGE_KEYS.MAIN_PRODUCT,
        AppConfig.STORAGE_KEYS.FINAL_UPSELL,
        AppConfig.STORAGE_KEYS.CUSTOMER_INFO
    ];
    
    keysToClean.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to remove ${key} from localStorage:`, error);
        }
    });
} 