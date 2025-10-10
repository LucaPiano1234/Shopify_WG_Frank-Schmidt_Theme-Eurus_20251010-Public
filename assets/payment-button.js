if (!window.Eurus.loadedScript.includes('payment-button.js')) {
  window.Eurus.loadedScript.push('payment-button.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xShopifyPaymentBtn', {
        load(e) {
          if (Shopify && Shopify.PaymentButton) {
            Shopify.PaymentButton.init();
          }
        },
      });
    });
  });
}