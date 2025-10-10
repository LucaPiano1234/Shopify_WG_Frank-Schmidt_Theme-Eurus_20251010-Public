if (!window.Eurus.loadedScript.includes('frequently-bought-together.js')) {
  window.Eurus.loadedScript.push('frequently-bought-together.js');
  
  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data('xProductFrequently', (
        sectionId
      ) => ({
        show: false,
        products: "",
        productsList: [],
        productsListDraft: [],
        loading: false,
        addToCartButton: "",
        errorMessage: false,
        isSelectItems: false,
        init() {
          this.$watch('productsListDraft', () => {
            if (this.productsList === this.productsListDraft) {
              this.isSelectItems = false;
            } else {
              this.isSelectItems = true;
            }
            document.dispatchEvent(new CustomEvent(`eurus:product-fbt:productsList-changed-${sectionId}`, {
              detail: {
                productsList: this.productsListDraft
              }
            }));
          });
        },
        openPopup() {
          this.show = true;
          Alpine.store('xPopup').open = true;
        },
        closePopup() {
          this.show = false;
          Alpine.store('xPopup').close();
        },
        addToListDraft(el, productId, productUrl, hasVariant, cal) {
          let productsListDraft = JSON.parse(JSON.stringify(this.productsListDraft));
          const productName = el.closest(".x-product-fbt-data").querySelector(".product-name").textContent;
          const currentVariant =  JSON.parse(el.closest(".x-product-fbt-data").querySelector(".current-variant").textContent);
          const price = !hasVariant && JSON.parse(el.closest(".x-product-fbt-data").querySelector(".current-price").textContent);
          const featured_image = currentVariant.featured_image ? currentVariant.featured_image.src : el.closest(".x-product-fbt-data").querySelector(".featured-image").textContent;
          const vendor = el.closest(".x-product-fbt-data").querySelector(".vendor") ? el.closest(".x-product-fbt-data").querySelector(".vendor")?.textContent : '';
          const rating = el.closest(".x-product-fbt-data").querySelector(".rating-fbt") ? el.closest(".x-product-fbt-data").querySelector(".rating-fbt")?.innerHTML : '';

          let productQuantity = parseInt(el.closest(".x-product-fbt-data").querySelector(".current-quantity").value);
          if (cal == 'plus') {
            productQuantity = productQuantity + 1;
          } 
          if (cal == 'minus') {
            productQuantity = productQuantity - 1;
          }
          let variantId = hasVariant ? currentVariant.id : currentVariant; 
          let newProductsListDraft = [];
          let newItem = hasVariant ? { ...currentVariant, title: currentVariant.title.replaceAll("\\",""), product_id: productId, product_name: productName, productUrl: `${productUrl}?variant=${currentVariant.id}`, featured_image: featured_image, quantity: productQuantity, vendor: vendor, rating: rating} : { id: variantId, product_id: productId, product_name: productName, productUrl: productUrl, featured_image: featured_image, quantity: productQuantity, price: price, vendor: vendor, rating: rating}
          productsListDraft = productsListDraft.filter(item => item.id !== variantId);
          newProductsListDraft = [...productsListDraft , newItem];
          newProductsListDraft = newProductsListDraft.filter(item => item.quantity > 0);
          this.productsListDraft = newProductsListDraft;
          this.errorMessage = false;
        },
        addToList(el) {
          this.productsList = this.productsListDraft;
          this. closePopup(el);
        },
        handleAddToCart(el) {
          let items = JSON.parse(JSON.stringify(this.productsList));
          
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
            if (response.status == '422') {
              const error_message = el.closest('.list-items').querySelector('.cart-warning');

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
            this.productsList = [];
            this.productsListDraft = [];
            this.totalPrice = 0;
          })
          .catch((error) => {
            console.error('Error:', error);
          }).finally(() => {
            this.loading = false;
          })
        },
        removeItem(el, indexItem) {
          let item = this.productsList[indexItem]
          let newProductsList = this.productsList.filter((item, index) => index != indexItem)
          this.productsList = newProductsList;
          this.productsListDraft = this.productsList;
          document.dispatchEvent(new CustomEvent(`eurus:product-bundle:remove-item-${sectionId}`, {
            detail: {
              item: item,
              el: el
            }
          }));
        }
      }));

      Alpine.data('xProductItemFBT', (
        sectionId,
        handleSectionId,
        productUrl,
        hasVariant
      ) => ({
        qty: 1,
        productList: [],
        currentVariant: '',
        showButton: true,
        productUrl: productUrl,
        init() {
          if (hasVariant) {
            document.addEventListener(`eurus:product-card-variant-select:updated:${sectionId}`, (e) => {
              this.currentVariant = e.detail.currentVariant
              if (this.currentVariant && this.currentVariant.id) {
                this.productUrl = productUrl + `/?variant=${this.currentVariant.id}`
              }
              if (this.currentVariant) {
                this.renderAddButton();
              } else {
                this.showButton = true;
              }
            });
          }

          document.addEventListener(`eurus:product-fbt:productsList-changed-${handleSectionId}`, (e) => {
            this.productList = e.detail.productsList;
            this.renderAddButton();
          })
        },
        renderAddButton() {
          const currentVariant = JSON.parse(document.getElementById('current-variant-'+ sectionId).textContent);
          let variantId = typeof currentVariant === 'object' ? currentVariant?.id : currentVariant;
          const itemVariant = this.productList.find(({ id }) => id === variantId);
          if (itemVariant) {
            this.showButton = false;
            this.qty = itemVariant.quantity;
          } else {
            this.showButton = true;
            this.qty = 1;
          }
        },
        minus(value) {
          this.qty = parseInt(this.qty);
          (this.qty == 1) ? this.qty = 1 : this.qty -= value;
        },
        plus(value) {
          this.qty = parseInt(this.qty);
          this.qty += value;
        },
        invalid(el) {
          number = parseFloat(el.value);
          if (!Number.isInteger(number) || number < 1) {
            this.qty = 1;
          }
        }
      }));
    });
  });
}