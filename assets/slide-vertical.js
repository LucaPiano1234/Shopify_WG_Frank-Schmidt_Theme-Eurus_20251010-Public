if (!window.Eurus.loadedScript.includes('slide-vertical.js')) {
  window.Eurus.loadedScript.push('slide-vertical.js');

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data('xSlideVertical', () => ({
        slideIndex: '',
        slideOnMouseDown: false,
        slideOfset: 0,
        scrollTopBody: 0,
        slideHandleMouseDown(e, touch) {
          if (this.slideIndex != '') {
            this.scrollTopBody = document.documentElement.scrollTop;
            this.slideOnMouseDown = true;
            if (touch) {
              this.slideOfset = e.targetTouches[0].pageY;
            } else {
              this.slideOfset = e.pageY;
            }
          }
        },
        slideHandleMouseMove(e, touch) {
          if(!this.slideOnMouseDown) return;
          e.preventDefault();
          if (this.slideIndex != '') {
            let spacing = 0;
            if (touch) {
              spacing = this.slideOfset - e.targetTouches[0].pageY;
            } else {
              spacing = this.slideOfset - e.pageY;
            }
            if (this.slideIndex == 'first' && spacing > -20) return;
            if (this.slideIndex == 'last' && spacing < 20) return;
            let spacingMove = this.scrollTopBody + spacing * 2;
            window.scrollTo({top: spacingMove , behavior: 'smooth'});
          }
        },
        slideHandleMouseLeave() {
          this._slideRemoveGrabing();
        },
        slideHandleMouseUp() {
          this._slideRemoveGrabing();
        },
        _slideRemoveGrabing() {
          this.slideOnMouseDown = false;
        },
      }))
    });
  });
} 