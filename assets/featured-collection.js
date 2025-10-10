if (!window.Eurus.loadedScript.includes('featured-collection.js')) {
  window.Eurus.loadedScript.push('featured-collection.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xFeaturedCollection', (sectionId, pageParam, container) => ({
        sectionId: sectionId,
        pageParam: pageParam,
        currentTab: 1,
        loading: true,
        loaded: [],
        showCollection: false,
        select(index) {
          this.currentTab = index;
          if (Shopify.designMode) {
            this.currentTab = index - 1;
            const content = document.createElement('div');
            const template = container.querySelector(`#x-fc-${sectionId}-${index}`);
            if (template) {
              content.appendChild(template.content.firstElementChild.cloneNode(true));
              container.appendChild(content.querySelector('.x-fc-content'));
              template.remove();
            }
            
            this.loading = false;
          }
        },
        loadData(index) {
          const selectedPage = index - 1;
          if (!this.loaded.includes(selectedPage)) {
            this.loading = true;
            
            let url = `${window.location.pathname}?section_id=${this.sectionId}&${this.pageParam}=${index}`;
            fetch(url, {
              method: 'GET'
            }).then(
              response => response.text()
            ).then(responseText => {
              const html = (new DOMParser()).parseFromString(responseText, 'text/html');
              const contentId = `x-fc-${this.sectionId}-${index}`;
              if (Shopify.designMode && document.getElementById(contentId)) {
                document.getElementById(contentId).remove();
              }
              const newContent = html.getElementById(contentId);
              if (newContent && !document.getElementById(contentId)) {
                container.appendChild(newContent);
                this.loaded.push(selectedPage);
              }
              this.loading = false;
            })
          }
        },
        scrollIntoView(element) {
          const scrollableContainer = element.closest('.overflow-auto'); 
          const elementPosition = element.offsetLeft;

          scrollableContainer.scroll({
            left: elementPosition,
            behavior: 'smooth'
          });
        }
      }));
    });
  });
}