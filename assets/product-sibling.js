if (!window.Eurus.loadedScript.includes('product-sibling.js')) {
  window.Eurus.loadedScript.push('product-sibling.js');

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data("xProductSibling", (sectionId, isProductPage) => ({
        cachedResults: [],
        updateProductInfo(url) {
          const link = isProductPage?`${url}`:`${url}?section_id=${sectionId}`;
      
          if (this.cachedResults[link]) {
            const html = this.cachedResults[link];
            this._handleSwapProduct(html);
          } else {
            fetch(link)
            .then((response) => response.text())
            .then((responseText) => {
              const html = new DOMParser().parseFromString(responseText, 'text/html');
              this._updateTitle(html);
              this._handleSwapProduct(html);
              this.cachedResults[link] = html;
            })
          }
          this._updateURL(url);
        },
        changeSelectOption(event) {
          const input = event.target.selectedOptions[0];
          const targetUrl = input.dataset.productUrl;
          this.updateProductInfo(targetUrl);
        },
        _updateURL(url) {
          if (!isProductPage) return;
          window.history.replaceState({}, '', `${url}`);
        },
        _updateTitle(html) {
          if (!isProductPage) return;
          document.querySelector('head title').textContent = html.querySelector('.product-title').textContent;
        },
        _handleSwapProduct(html) {
          if (isProductPage) {
            const destination = document.querySelector('main');
            const source = html.querySelector('main');
            if (source && destination) destination.innerHTML = source.innerHTML;
          } else {
            const destination = document.querySelector('.x-product-' + sectionId);
            const source = html.querySelector('.x-product-' + sectionId);
            if (source && destination) destination.innerHTML = source.innerHTML;
          }
        }
      }));
    });
  });
}