if (!window.Eurus.loadedScript.includes('product-cart.js')) {
  window.Eurus.loadedScript.push('product-cart.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xProductCart', (
        wrappringVariantId,
      ) => ({
        loading: false,
        errorMessage: false,
        buttonSubmit: "",
        error_message_wrapper: {},
        stopAction: false,
        async addToCart(e, required, quickView) {
          e.preventDefault();
          if (required) {
            var productInfo = this.$el.closest('.product-info');
            if (productInfo) {
              var propertiesInput = productInfo.querySelectorAll(`.customization-picker`);
              this.stopAction = false;
              propertiesInput.length && propertiesInput.forEach((input) => {
                if (input.required && input.value == '' || input.classList.contains("validate-checkbox")) {
                  input.classList.add("required-picker");
                  this.stopAction = true;
                }
              });
            }
            if (this.stopAction) {
              return true;
            }
          }

          this.loading = true;

          if (this.$refs.gift_wrapping_checkbox && this.$refs.gift_wrapping_checkbox.checked && wrappringVariantId) {
            const giftData = {
              items: [
                {
                  id: wrappringVariantId,
                  quantity: 1
                }
              ]
            };
            const giftResponse = await window.fetch('/cart/add.js', {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify(giftData),
            });
    
            const giftResponse1 = await giftResponse.json();
            if (!giftResponse.ok) {
              if (giftResponse1.status == 422) {
                this.$refs.gift_wrapping_error.textContent = giftResponse1.description;
                this.loading = false;
                setTimeout(() => {
                  this.$refs.gift_wrapping_error.textContent = "";
                }, 5000);
              }
              return;
            }
          }

          var productForm = this.$el.closest('.product-info') || this.$el.closest('form');
          var edt_element = productForm ? productForm.querySelector('.hidden.cart-edt-properties') : null;
          if (edt_element) {
            edt_element.value = edt_element.value.replace("time_to_cut_off", Alpine.store('xEstimateDelivery').noti)
          }

          let formData = new FormData(this.$refs.product_form);
          formData.append(
            'sections',
            Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          await fetch(`${Eurus.cart_add_url}`, {
            method:'POST',
            headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
          }).then(reponse => {
            return reponse.json();
          }).then((response) => {
            if (response.status == '422') {
              if (typeof response.errors == 'object') {
                this.error_message_wrapper = response.errors;
                document.querySelector('.recipient-error-message').classList.remove('hidden');
              } else {
                this.errorMessage = true;
                if(this.$refs.error_message){
                  this.$refs.error_message.textContent = response.description;
                }
                if(this.$refs.error_message_mobile){
                  this.$refs.error_message_mobile.textContent = response.description;
                }
              }
              if (Alpine.store('xMiniCart')) {
                Alpine.store('xMiniCart').reLoad();
              }
            } else {
              document.querySelector('.recipient-error-message') ? document.querySelector('.recipient-error-message').classList.add('hidden') : '';
              this.error_message_wrapper = {};

              
  
              if (Alpine.store('xQuickView') && Alpine.store('xQuickView').show) {
                Alpine.store('xQuickView').show = false;
              }
              Alpine.store('xPopup').close();
              if((quickView && Alpine.store('xQuickView').buttonQuickView && Alpine.store('xQuickView').buttonQuickView.dataset.addAsBundle) || (!quickView && this.$refs.product_form && this.$refs.product_form.querySelector('[data-add-as-bundle="true"]'))) {
                document.dispatchEvent(new CustomEvent("eurus:cart:add-as-bundle"));
              } else {
                Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
                  const sectionElement = document.querySelector(section.selector);
                  if (sectionElement) {
                    if (response.sections[section.id])
                      sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
                  }
                }));
                Alpine.store('xMiniCart').openCart();
                Alpine.store('xCartHelper').currentItemCount = parseInt(document.querySelector('#cart-icon-bubble span').innerHTML);
                document.dispatchEvent(new CustomEvent("eurus:cart:items-changed"));
              }
            }
          }).catch((error) => {
            console.error('Error:', error);
          }).finally(() => {
            this.loading = false;
            if ((quickView && Alpine.store('xQuickView').buttonQuickView && !Alpine.store('xQuickView').buttonQuickView.dataset.addAsBundle) || (!quickView && this.$refs.product_form && !this.$refs.product_form.querySelector('[data-add-as-bundle="true"]'))) {
              if(this.$refs.gift_wrapping_checkbox) this.$refs.gift_wrapping_checkbox.checked = false;
            }
          }) 
        }
      }))
    });
  });
}
