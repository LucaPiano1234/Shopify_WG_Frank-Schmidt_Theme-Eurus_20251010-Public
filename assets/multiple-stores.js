requestAnimationFrame(() => {
  document.addEventListener("alpine:init", () => {
    Alpine.data("xMultipleStores", () => ({
      active: 1,
      open: false,
      canScroll: false,
      atTop: true,
      atBottom: false,
      load() {
        const canScrollVertically = this.$refs.list_stores.scrollHeight > this.$refs.list_stores.closest(".multi_stores_content").clientHeight;
        if (canScrollVertically) {
          this.canScroll = true;
        }
        window.addEventListener('resize', ()=> {
          this.heightNatural();
        })
        this.heightNatural();
      },
      heightNatural() {
        if (window.matchMedia("(min-width: 768px)").matches) {
          if(this.$refs.natural_height) {
             this.$refs.natural_height.style.height = this.$refs.h_img_location.offsetHeight +'px';
          }
        } else {
          if(this.$refs.natural_height) {
            this.$refs.natural_height.style.removeProperty('height');
          }
        }
      },
      openLocation(el) {
        this.open = true;
        var popupContent = document.getElementById(el.getAttribute("data-id"));
        

        this.$refs.content_location_detail.innerHTML = popupContent.innerHTML;
        const title = this.$refs.content_location_detail.querySelector('h5.location-title');
        if (title) {
          const h3 = document.createElement('h3');

          h3.innerHTML = title.innerHTML;
          h3.className = title.className;

          title.replaceWith(h3);
        }
      },
      hideLocation() {
        requestAnimationFrame(() => {
          this.open = false;
          Alpine.store('xPopup').open = false;
        });
      },
      scrollUp() {
        this.$refs.list_stores.scrollBy({
          top: -200, 
          behavior: 'auto'
        });
        this.checkCanScrollVertical()
      },
      scrollDown() {
        this.$refs.list_stores.scrollBy({
          top: 200,
          behavior: 'auto'
        });
        this.checkCanScrollVertical()
      },
      checkCanScrollVertical() {
        if (window.innerWidth < 768) {
          this.atTop = this.$refs.list_stores.scrollTop === 0;
          this.atBottom =(this.$refs.list_stores.scrollTop + this.$refs.list_stores.closest(".multi_stores_content").clientHeight) >= (this.$refs.list_stores.scrollHeight - 2);
        }
      }
    }));
  });
});