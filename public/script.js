// Shared JavaScript functions for the upsell flow

// Main checkout function for initial purchase
async function handleCheckout(productData) {
    const button = document.getElementById('checkout-btn');
    if (!button) return;
    
    setButtonLoading(button, true);
    
    try {
        const response = await fetch(AppConfig.getApiUrl('/api/create-checkout-session'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }
        
        // Redirect to Stripe Checkout
        if (data.url) {
            window.location.href = data.url;
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Something went wrong. Please try again.');
    } finally {
        setButtonLoading(button, false);
    }
}

// Upsell payment function for steps 2 and 3
async function handleUpsellPayment(paymentData) {
    const button = document.querySelector('.upsell-btn.primary');
    if (!button) return;
    
    setButtonLoading(button, true);
    
    try {
        const response = await fetch(AppConfig.getApiUrl('/api/upsell-payment'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert('Payment failed: ' + data.error);
            return;
        }
        
        if (data.success) {
            // Store customer data for next step
            if (paymentData.customerId) {
                localStorage.setItem('customerData', JSON.stringify({
                    customer_id: paymentData.customerId,
                    step: paymentData.step
                }));
            }
            
            // Handle successful payment based on step
            handleUpsellSuccess(paymentData.step);
        }
    } catch (error) {
        console.error('Upsell payment error:', error);
        alert('Something went wrong. Please try again.');
    } finally {
        setButtonLoading(button, false);
    }
}

// Handle successful upsell payment
function handleUpsellSuccess(step) {
    switch(step) {
        case 2:
            // First upsell successful, go to second upsell
            window.location.href = 'upsell2.html';
            break;
        case 3:
            // Final upsell successful, go to final success
            window.location.href = 'final-success.html?step=complete&upsell1=true&upsell2=true';
            break;
        default:
            window.location.href = 'final-success.html?step=complete';
    }
}

// Utility function to handle button loading states
function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    const btnText = button.querySelector('.upsell-btn-text');
    const loader = button.querySelector('.upsell-loader');
    
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (loader) loader.style.display = 'inline';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (loader) loader.style.display = 'none';
    }
}

// Retry logic for failed API requests
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            
            if (response.ok) {
                return response;
            }
            
            // If it's a client error (4xx), don't retry
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`Client error: ${response.status}`);
            }
            
            throw new Error(`Server error: ${response.status}`);
            
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt + 1} failed:`, error.message);
            
            // Don't retry on the last attempt
            if (attempt === maxRetries - 1) break;
            
            // Exponential backoff: wait 1s, 2s, 4s
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

// Format currency for display
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount / 100);
}

// Utility function to get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Enhanced notification system (DEPRECATED - Use inline errors instead)
function showNotification(message, type = 'info', duration = 5000) {
    // This function is deprecated - use inline error messages instead
    console.warn('showNotification is deprecated. Use inline error messages instead.');
    console.log('Notification:', type, message);
    
    // For legacy compatibility, fall back to console logging
    // Remove existing notifications
    const existing = document.querySelectorAll('.upsell-notification');
    existing.forEach(n => n.remove());
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

// Analytics and tracking functions
function trackEvent(eventName, properties = {}) {
    // Add your analytics tracking here (Google Analytics, Facebook Pixel, etc.)
    console.log('Event tracked:', eventName, properties);
    
    // Example for Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
    
    // Example for Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, properties);
    }
}

// Track page views
function trackPageView(pageName) {
    trackEvent('page_view', {
        page_name: pageName,
        page_url: window.location.href
    });
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Track page view
    const pageName = document.title || 'Unknown Page';
    trackPageView(pageName);
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading states to all buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            if (this.type !== 'submit' && !this.classList.contains('no-loading')) {
                // Add a small delay to show loading state
                setTimeout(() => {
                    setButtonLoading(this, false);
                }, 100);
            }
        });
    });
});

// Handle form submissions with loading states
function handleFormSubmit(form, submitHandler) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = form.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true);
        
        try {
            await submitHandler(form);
        } catch (error) {
            console.error('Form submission error:', error);
            showNotification('Something went wrong. Please try again.', 'error');
        } finally {
            setButtonLoading(submitButton, false);
        }
    });
}

// Countdown timer utility
function createCountdownTimer(elementId, duration, onComplete) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let timeLeft = duration;
    
    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            element.textContent = "EXPIRED";
            if (onComplete) onComplete();
        }
        
        timeLeft--;
    }, 1000);
    
    return timer;
}

// Local storage utilities
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to get from localStorage:', error);
        return null;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to remove from localStorage:', error);
    }
} 