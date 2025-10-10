if (!window.Eurus.loadedScript.includes('map.js')) {
  window.Eurus.loadedScript.push('map.js');

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data("xMap", (data) => ({
        load() {
          this.$el.querySelector(
            "iframe"
          ).src = `https://maps.google.com/maps?q=${data}&t=m&z=17&ie=UTF8&output=embed&iwloc=near`;
        },
        loadMap(location) {
          this.$el.querySelector(
            "iframe"
          ).src = `https://maps.google.com/maps?q=${location}&t=m&z=17&ie=UTF8&output=embed&iwloc=near`;
        },
        removeMap() {
          this.$el.querySelector(
            "iframe"
          ).src = ``;
        } 
      }));
    });
  });
}