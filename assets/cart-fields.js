if (!window.Eurus.loadedScript.has('cart-fields.js')) {
  window.Eurus.loadedScript.add('cart-fields.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xCartFields', (isCartDrawer) => ({
        custom_field: '',
        custom_field_label: '',
        custom_field_required: false,
        custom_field_error: false,
        openField: false,
        t: '',
        loadData() {
          const data = xParseJSON(this.$el.getAttribute('x-cart-fields-data'));

          this.custom_field = localStorage.cart_custom_field ? localStorage.cart_custom_field : '';
          this.custom_field_label = data.custom_field_label;
          this.custom_field_required = data.custom_field_required;
          this.custom_field_pattern = new RegExp(data.custom_field_pattern);
          this.save();

          if (isCartDrawer) {
            document.querySelector("#x-cart-custom-field").addEventListener("focusout", (event) => {
              this.save();
            });
          } else {
            this.$el.querySelector("#x-cart-custom-field").addEventListener("focusout", (event) => {
              this.save();
            });
          }
          document.addEventListener('eurus:cart:validate', (e) => {
            this.custom_field = localStorage.cart_custom_field ? localStorage.cart_custom_field : '';
            if (this.custom_field_required && (!this.custom_field || this.custom_field.length == 0)
              || (this.custom_field && !this.custom_field.match(this.custom_field_pattern))) {
              this.custom_field_error = true;              
              Alpine.store('xCartHelper').validated = false;
              if (e.detail.isCheckOut) {
                Alpine.store('xCartHelper').openField = 'custom_field'
              }
            } else {
              this.custom_field_error = false;
            }
          });
        },
        save(custom_field_value) {
          clearTimeout(this.t);

          if (custom_field_value) {
            this.custom_field = custom_field_value
          }
          const func = () => {
            var attributes = { attributes: {} }
            attributes.attributes[this.custom_field_label] = this.custom_field;
            Alpine.store('xCartHelper').updateCart(attributes, true);
            localStorage.cart_custom_field = this.custom_field;
          }
          
          this.t = setTimeout(() => {
            func();
          }, 200);
        }
      }));
    })
  });
}