if (!window.Eurus.loadedScript.includes('scrolling-promotion.js')) {
  window.Eurus.loadedScript.push('scrolling-promotion.js');
  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xScrollPromotion', {
        load(el) {
          let scroll = el.getElementsByClassName('el_animate');
          for (let i = 0; i < scroll.length; i++) {
            scroll[i].classList.add('animate-scroll-banner');
          }
        }
      });
    })
  });
}    