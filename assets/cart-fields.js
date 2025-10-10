if (!window.Eurus.loadedScript.includes('cart-fields.js')) {
  window.Eurus.loadedScript.push('cart-fields.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xCartFields', () => ({
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

          this.$watch('custom_field', () => {
            this.save();
          });

          document.addEventListener('eurus:cart:validate', () => {
            this.custom_field = localStorage.cart_custom_field ? localStorage.cart_custom_field : '';
            if (this.custom_field_required && (!this.custom_field || this.custom_field.length == 0)
              || (this.custom_field && !this.custom_field.match(this.custom_field_pattern))) {
              this.custom_field_error = true;
              Alpine.store('xCartHelper').openField = 'custom_field';
              Alpine.store('xCartHelper').validated = false;
            } else {
              this.custom_field_error = false;
            }
          });
        },
        save() {
          clearTimeout(this.t);

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