if (!window.Eurus.loadedScript.includes("product-tabs.js")) {
  window.Eurus.loadedScript.push("product-tabs.js");

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data("xProductTabs", () => ({
        open: 0, 
        openMobile: false, 
        tabActive: '',
        setTabActive() {
          const tabActive = this.$el.dataset.tabtitle;
          this.tabActive = tabActive;
        }
      }));
    });
  });
}
