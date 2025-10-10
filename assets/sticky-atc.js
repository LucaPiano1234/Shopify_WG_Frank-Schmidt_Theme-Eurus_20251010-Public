if (!window.Eurus.loadedScript.includes('sticky-atc.js')) {
  window.Eurus.loadedScript.push('sticky-atc.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xStickyATC', (sectionId, is_combined) => ({
        openDetailOnMobile: false,
        currentAvailableOptions: [],
        options: [],
        init() {
          if (!is_combined) {
            this.variants = xParseJSON(this.$el.getAttribute('x-variants-data'));
          }

          document.addEventListener(`eurus:product-page-variant-select:updated:${sectionId}`, (e) => {
            if (is_combined) {
              this.renderVariant(e.detail.html);
            } else {
              this.currentAvailableOptions = e.detail.currentAvailableOptions,
              this.options = e.detail.options;
            }

            this.renderProductPrice(e.detail.html);
            this.renderMedia(e.detail.html);
          });
        },
        renderProductPrice(html) {
          const destinations = document.querySelectorAll(`.price-sticky-${sectionId}`);
          destinations.forEach((destination) => {
            const source = html.getElementById('price-sticky-' + sectionId);
            if (source && destination) destination.innerHTML = source.innerHTML;
          })
        },
        renderMedia(html) {
          const destination = document.getElementById('product-image-sticky-' + sectionId);
          const source = html.getElementById('product-image-sticky-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        renderVariant(html) {
          const destination = document.getElementById('variant-update-sticky-' + sectionId);
          const source = html.getElementById('variant-update-sticky-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        changeOptionSticky(event) {
          Array.from(event.target.options)
            .find((option) => option.getAttribute('selected'))
            .removeAttribute('selected');
          event.target.selectedOptions[0].setAttribute('selected', 'selected');
          const input = event.target.selectedOptions[0];
          const inputId = input.id;
          const targetUrl = input.dataset.productUrl;
          const variantEl = document.getElementById('variant-update-sticky-' + sectionId);
          document.dispatchEvent(new CustomEvent(`eurus:product-page-variant-select-sticky:updated:${sectionId}`, {
            detail: {
              inputId: inputId,
              targetUrl: targetUrl,
              variantElSticky: variantEl
            }
          }));
        }
      }))
    })
  })
}