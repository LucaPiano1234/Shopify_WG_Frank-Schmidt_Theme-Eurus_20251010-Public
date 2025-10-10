if (!window.Eurus.loadedScript.includes('re-order.js')) {
  window.Eurus.loadedScript.push('re-order.js');

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.store('xReOrder', {
        show: false,
        orderName: '',
        itemsCart: '',
        itemsCartNew: [],
        errorMessage: false,
        loading: false,
        clearSuccess: false,
        loadingClearCart: false,
        disableReorder: false,
        load(el, orderName) {
          this.errorMessage = false;
          this.showReorderPopup();
          let data = el.closest('.re-order-action').querySelector('.x-order-data').getAttribute('x-order-data');
          this.orderName = orderName;
          // check value of available
          this.itemsCart = xParseJSON(data).map((product) => (product.variant_available && product.available ) ? { ...product, title: this.unescapeText(product.title) } : { ...product, disable: true, title: this.unescapeText(product.title) });
          this.disableReorder = this.itemsCart.findIndex((element) => !element.disable) == -1 ? true : false;
          this.itemsCartNew = this.itemsCart;
        },
        setItemsCart(product) {
          let newItems = [];
          this.itemsCartNew.forEach((cartItem) => {
            if (cartItem.id == product.id && cartItem.variant_id == product.variant_id) {
              cartItem.quantity = product.quantity;
            }
            newItems.push(cartItem);
          });
          this.itemsCartNew = newItems;
        },
        handleAddToCart(el) {
          this.loading = true;
          this.clearSuccess = false;
          let items = [];
          let formData = new FormData();

          JSON.parse(JSON.stringify(this.itemsCartNew)).filter(itemCart => !itemCart.disable && items.push({ "id": itemCart.variant_id, "quantity": itemCart.quantity }));
          formData.append(
            'sections',
            Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          formData.append('items', JSON.stringify(items));

          fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body:  JSON.stringify({ "items": items, "sections":  Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id) })
          }).then((response) => {
            return response.json();
          }).then((response) => {
            if (response.status == '422') {
              const error_message = el.closest('.reorder-popup').querySelector('.cart-warning');
              this.errorMessage = true;
              if (error_message) {
                error_message.textContent = response.description;
              }
              return;
            } 
            this.closeReorderPopup();
            
            Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
              const sectionElement = document.querySelector(section.selector);

              if (sectionElement) {
                if (response.sections[section.id])
                  sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
              }
            }));
            if (Alpine.store('xQuickView') && Alpine.store('xQuickView').show) {
              Alpine.store('xQuickView').show = false;
            }
            Alpine.store('xPopup').close();
            Alpine.store('xMiniCart').openCart();
            Alpine.store('xCartHelper').currentItemCount = parseInt(document.querySelector('#cart-icon-bubble span').innerHTML);
            document.dispatchEvent(new CustomEvent("eurus:cart:items-changed"));
          })
          .catch((error) => {
            console.error('Error:', error);
          }).finally(() => {
            this.loading = false;
          })
        },
        clearCart() {
          this.loadingClearCart = true;
          this.errorMessage = false;
          fetch(window.Shopify.routes.root + 'cart/clear.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body:  JSON.stringify({ "sections":  Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id) })
          })
          .then((response) => response.json())
          .then((response) => {
            this.clearSuccess = true;
            Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
              const sectionElement = document.querySelector(section.selector);
              if (sectionElement) {
                if (response.sections[section.id])
                  sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
              }
            }));
            Alpine.store('xCartHelper').currentItemCount = parseInt(document.querySelector('#cart-icon-bubble span').innerHTML);
            document.dispatchEvent(new CustomEvent("eurus:cart:items-changed"));
          })
          .catch((error) => {
            console.error('Error:', error);
          }).finally(() => {
            this.loadingClearCart = false;
          })            
        },
        showReorderPopup() {
          this.show = true;
          Alpine.store('xPopup').open = true;
        },
        closeReorderPopup() {
          this.show = false;
          this.clearSuccess = false;
          this.errorMessage = false;
          Alpine.store('xPopup').close();
        },
        unescapeText(str) {
          return str.replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        }
      });
    });
  });
}