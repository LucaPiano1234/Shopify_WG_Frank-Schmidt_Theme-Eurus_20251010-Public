if (!window.Eurus.loadedScript.includes('image-comparison.js')) {
  window.Eurus.loadedScript.push('image-comparison.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xImageComparison', (sectionId, layout) => ({
        load(e) {
          if(layout == "horizontal") {
            this.$refs.image.style.setProperty('--compare_' + sectionId, e.target.value + '%');
          } else {
            this.$refs.image.style.setProperty('--compare_vertical_' + sectionId, 100 - e.target.value + '%');
          }
        },
        resizeWindow(el) {
          addEventListener("resize", () => {
            this.setMinMaxInput(el, layout);
          });
        },
        disableScroll(el) {
          let isfocus = true;
          window.addEventListener('wheel', () => {
            if (isfocus) {
              el.blur();
              isfocus = false;
            }
          });
        },
        setMinMaxInput(el) {
          let totalSpacing = layout == 'horizontal' ? el.offsetWidth : el.offsetHeight;
          let spacing = ((24/totalSpacing)*100).toFixed(1);
          if (spacing > 0) {
            el.min = spacing;
            el.max = 100 - spacing;
          }
        }
      }));
    });
  });
}