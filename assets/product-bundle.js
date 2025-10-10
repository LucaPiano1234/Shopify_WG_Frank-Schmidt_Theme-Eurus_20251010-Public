if (!window.Eurus.loadedScript.includes('product-bundle.js')) {
window.Eurus.loadedScript.push('product-bundle.js');

requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.data('xProductBundle', (
      sectionId,
      minimumItems,
      shopCurrency,
      discountType,
      discountValue,
      applyDiscountOncePerOrder
    ) => ({
      products: "",
      productsBundle: [],
      loading: false,
      addToCartButton: "",
      totalPrice: 0,
      errorMessage: false,
      showBundleContent: false,
      totalDiscount: 0,
      amountPrice: 0,
      initBandle(el) {
        this.addToCartButton = el.querySelector(".button-atc");
        this.handleProductsBundle();
      },
      handleProductsBundle() {
        this.$watch('productsBundle', () => {
          document.dispatchEvent(new CustomEvent(`eurus:product-bundle:productsList-changed-${sectionId}`, {
            detail: {
              productsBundle: this.productsBundle
            }
          }));
        });
      },
      addToBundle(el, productId, productUrl, hasVariant) {
        let productsBundle = JSON.parse(JSON.stringify(this.productsBundle))
        const productName = el.closest(".x-product-bundle-data").querySelector(".product-name").textContent;
        const currentVariant =  JSON.parse(el.closest(".x-product-bundle-data").querySelector(".current-variant").textContent);
        const price =  !hasVariant && JSON.parse(el.closest(".x-product-bundle-data").querySelector(".current-price")?.textContent);
        const featured_image = currentVariant.featured_image ? currentVariant.featured_image.src : el.closest(".x-product-bundle-data").querySelector(".featured-image").textContent;
        let variantId = hasVariant ? currentVariant.id : currentVariant; 
        let newProductsBundle = [];
        let newItem = hasVariant ? { ...currentVariant, title: currentVariant.title.replaceAll("\\",""), product_id: productId, product_name: productName, productUrl: `${productUrl}?variant=${currentVariant.id}`, featured_image: featured_image, quantity: 1} : { id: variantId, product_id: productId, product_name: productName, productUrl: productUrl, featured_image: featured_image, quantity: 1, price: price}
        
        newProductsBundle = [...productsBundle , newItem];
        this.productsBundle = newProductsBundle;
        this.errorMessage = false;
        this.updateBundleContent(newProductsBundle)
      },
      handleAddToCart(el) {
        let items = JSON.parse(JSON.stringify(this.productsBundle));
        items = items.reduce((data, product) => {
          data[product.id] ? data[product.id].quantity += product.quantity : data[product.id] = product;
          return data;
        }, {});

        this.loading = true;
        fetch(window.Shopify.routes.root + 'cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body:  JSON.stringify({ "items": items, "sections":  Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id) })
        }).then((response) => {
          return response.json();
        }).then((response) => {

          document.dispatchEvent(new CustomEvent(`eurus:product-bundle:products-changed-${sectionId}`, {
            detail: {
              productsBundle: Object.values(items),
              el: el.closest(".product-bundler-wrapper")
            }
          }));

          if (response.status == '422') {
            const error_message = el.closest('.bundler-sticky').querySelector('.cart-warning');

            this.errorMessage = true;
            if (error_message) {
              error_message.textContent = response.description;
            }
            return;
          } 

          this.errorMessage = false;
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
          this.productsBundle = [];
          this.totalPrice = 0;
          this.addToCartButton.setAttribute('disabled', 'disabled');
        })
      },
      updateBundleContent(productsBundle) {
        let total = productsBundle.map(item => item.price).reduce((total, item) => total + item, 0);
        
        if (productsBundle.length >= minimumItems) {
          this.addToCartButton.removeAttribute('disabled');
          let discount = 0;
          let totalDiscount = 0;
          if (!Number.isNaN(discountValue)) {
            discount = Number(discountValue);

            if (discountType == 'percentage' && Number.isInteger(discount) && discount > 0 && discount < 100) {
              totalDiscount = Math.ceil(total - total * discount / 100);
            }

            if (discountType == 'amount' && discount > 0) {
              discount = (Number.parseFloat(discountValue)).toFixed(2);
              if (applyDiscountOncePerOrder) {
                totalDiscount = total - discount * Shopify.currency.rate * 100;
              } else {
                totalDiscount = total - productsBundle.length * discount * Shopify.currency.rate * 100;
              }
            }

            if (totalDiscount > 0) {
              this.totalDiscount = this.formatMoney(totalDiscount, shopCurrency);
              let amount = total - totalDiscount;
              this.amountPrice = "-" + this.formatMoney(amount, shopCurrency);
            }
          } else {
            this.totalDiscount = 0;
            this.amountPrice = 0;
          }
        } else {
          this.totalDiscount = 0;
          this.addToCartButton.setAttribute('disabled', 'disabled');
        }
        this.totalPrice = this.formatMoney(total, shopCurrency);
      },
      removeBundle(el, indexItem) {
        let item = this.productsBundle[indexItem]
        let newProductsBundle = this.productsBundle.filter((item, index) => index != indexItem)
        this.productsBundle = newProductsBundle;
        this.updateBundleContent(newProductsBundle);

        document.dispatchEvent(new CustomEvent(`eurus:product-bundle:remove-item-${sectionId}`, {
          detail: {
            item: item,
            el: el
          }
        }));
      },
      formatWithDelimiters(number, precision, thousands, decimal) {
        precision = this.defaultOption(precision, 2);
        thousands = this.defaultOption(thousands, ',');
        decimal   = this.defaultOption(decimal, '.');
    
        if (isNaN(number) || number == null) { return 0; }
    
        number = (number/100.0).toFixed(precision);
    
        var parts   = number.split('.'),
            dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
            cents   = parts[1] ? (decimal + parts[1]) : '';
    
        return dollars + cents;
      },
      defaultOption(opt, def) {
        return (typeof opt == 'undefined' ? def : opt);
      },
      formatMoney(amount, formatString) {
        var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
        switch(formatString.match(placeholderRegex)[1]) {
          case 'amount':
            value = this.formatWithDelimiters(amount, 2);
            break;
          case 'amount_no_decimals':
            value = this.formatWithDelimiters(amount, 0);
            break;
          case 'amount_with_comma_separator':
            value = this.formatWithDelimiters(amount, 2, '.', ',');
            break;
          case 'amount_no_decimals_with_comma_separator':
            value = this.formatWithDelimiters(amount, 0, '.', ',');
            break;
        }
      
        return formatString.replace(placeholderRegex, value);
      }
    }));

    Alpine.data('xProductItemBundle', (
      sectionId,
      addToBundle,
      handleSectionId,
      productUrl,
      productId,
      hasVariant,
      productOnlyAddedOnce
    ) => ({
      dataVariant: [],
      currentVariant: '',
      isSelect: false,
      productId: productId,
      productUrl: productUrl,
      initVariant() {
        let xDataVariant = this.$el.querySelector('[type="application/json"]');
        if (xDataVariant) {
          let data = JSON.parse(xDataVariant.textContent);
          data = data?.map(item => ({ disable: false, id: item.id }));
          this.dataVariant = data;
        }
        this.initEvent();
      },
      initEvent() {
        if (hasVariant) {
          document.addEventListener(`eurus:product-card-variant-select:updated:${sectionId}`, (e) => {
            this.currentVariant = e.detail.currentVariant,
            this.options = e.detail.options;
            this.renderAddToBundleButton();
            this.checkVariantSelected();
            if (this.currentVariant && this.currentVariant.id) {
              this.productUrl = productUrl + `/?variant=${this.currentVariant.id}`
            }
          });
        }

        document.addEventListener(`eurus:product-bundle:products-changed-${handleSectionId}`, (e) => {
          e.detail.productsBundle.map(item => {
            if(hasVariant && item.product_id == this.productId && this.currentVariant.available) {
              let buttonATC = document.querySelector('#x-atc-button-' + sectionId);
              if (buttonATC) buttonATC.removeAttribute('disabled');
            } else if(item.product_id == this.productId) {
              let buttonATC = document.querySelector('#x-atc-button-' + sectionId);
              if (buttonATC) buttonATC.removeAttribute('disabled');
            }
          })
          if(productOnlyAddedOnce) {
            this.setUnSelectVariant();
          }
        })

        document.addEventListener(`eurus:product-bundle:remove-item-${handleSectionId}`, (e) => {
          if (this.isSelect && e.detail.item.product_id == this.productId && hasVariant) {
            if (this.currentVariant && this.currentVariant.available) {
              let buttonATC = document.querySelector('#x-atc-button-' + sectionId);
              if (buttonATC) buttonATC.removeAttribute('disabled');
            }
            this.setUnSelectVariant(e.detail.item);
          } else if(e.detail.item.product_id == this.productId) { 
            let buttonATC = document.querySelector('#x-atc-button-' + sectionId);
            if (buttonATC) buttonATC.removeAttribute('disabled');

            if(productOnlyAddedOnce) {
              const cardProducts = document.querySelector('#bundle-product-' + e.detail.item.product_id);
              cardProducts?.classList.remove("cursor-pointer", "pointer-events-none", "opacity-70")
            }
          }
        })
      },
      setVariantSelected(el) {
        if (this.currentVariant && this.dataVariant.findIndex(item => (item.id == this.currentVariant.id && item.disable)) != -1) {
          let buttonATB = el.closest('.bundle-product').querySelector('.x-atb-button');
          buttonATB.setAttribute('disabled', 'disabled');
        }
      },
      setDisableSelectProduct(el) {
        if (productOnlyAddedOnce) {
          let newVariants = JSON.parse(JSON.stringify(this.dataVariant)).map(item => (item.id == this.currentVariant.id) ? { id: item.id, disable: true } : { id: item.id, disable: item.disable})
          this.dataVariant = newVariants;
          let buttonATB = el.closest('.bundle-product').querySelector('.x-atb-button');
          buttonATB.setAttribute('disabled', 'disabled');
        }
      },
      setUnSelectVariant(product) {
        let newVariants = "";
        if (product) {
          newVariants = JSON.parse(JSON.stringify(this.dataVariant)).map(item => (item.id == product.id) ? { id: item.id, disable: false } : { id: item.id, disable: item.disable})
        } else {
          newVariants = JSON.parse(JSON.stringify(this.dataVariant)).map(item => ({ id: item.id, disable: false }))
        }
        this.dataVariant = newVariants;
      },
      renderAddToBundleButton() {
        const buttonATB = document.getElementById('x-atc-button-' + sectionId)

        if (!buttonATB) return;

        if (this.currentVariant) {
          /// Enable add to cart button
          if (this.currentVariant.available) {
            buttonATB.removeAttribute('disabled');
            const addButtonText = buttonATB.querySelector('.x-atc-text');
            if (addButtonText) addButtonText.textContent = addToBundle;
          }
        }
      },
      checkVariantSelected() {
        const fieldset = [...document.querySelectorAll(`#variant-update-${sectionId} fieldset`)];
        if(fieldset.findIndex(item => !item.querySelector("input:checked")) == "-1") {
          this.isSelect = true;
        }
      }
    }));

    Alpine.data('xProductList', (
      sectionId,
      handleSectionId
    ) => ({
      productsList: [],
      init() {
        document.addEventListener(`eurus:product-bundle:productsList-changed-${handleSectionId}`, (e) => {
          this.productsList = e.detail.productsBundle;
        })
        document.addEventListener(`eurus:product-card-variant-select:updated:${sectionId}`, (e) => {
          this.renderAddButton();
        });
      },
      renderAddButton() {
        const currentVariant = JSON.parse(document.getElementById('current-variant-'+ sectionId).textContent);
        let variantId = typeof currentVariant === 'object' ? currentVariant?.id : currentVariant;
        const itemVariant = this.productsList.find(({ id }) => id === variantId);
        const buttonATB = document.getElementById('x-atc-button-' + sectionId);
        if (itemVariant && buttonATB) {
          setTimeout(() => {
            buttonATB.setAttribute('disabled', 'disabled');
          }, 100);
        }
      }
    }))
  });
});
}