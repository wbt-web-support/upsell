// JavaScript for index.html - Main product page
let productData = null;

document.addEventListener('DOMContentLoaded', async function() {
    await loadProduct();
    initializeContinue();
});

async function loadProduct() {
    try {
        setButtonLoading(document.getElementById('continue-btn'), true);
        
        const response = await fetch(AppConfig.getApiUrl(`/api/get-product?product_id=${AppConfig.getProductId('MAIN')}`));
        const data = await response.json();
        
        if (data.error) {
            alert('Error loading product: ' + data.error);
            return;
        }
        
        productData = data;
        
        // Update UI with product data
        document.getElementById('product-name').textContent = data.product.name;
        document.getElementById('product-description').textContent = data.product.description || '';
        document.getElementById('product-price').textContent = data.price.formatted;
        
        document.getElementById('continue-btn').disabled = false;
        setButtonLoading(document.getElementById('continue-btn'), false);
        
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Failed to load product. Please try again.');
    }
}

function initializeContinue() {
    const continueBtn = document.getElementById('continue-btn');
    
    continueBtn.addEventListener('click', function() {
        // Store product data for checkout page
        localStorage.setItem(AppConfig.STORAGE_KEYS.MAIN_PRODUCT, JSON.stringify(productData));
        window.location.href = '/funnel-checkout.html';
    });
} 