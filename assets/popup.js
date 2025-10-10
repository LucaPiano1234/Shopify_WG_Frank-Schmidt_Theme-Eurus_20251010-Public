if (!window.Eurus.loadedScript.includes('popup.js')) {
  window.Eurus.loadedScript.push('popup.js');
  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => { 
      Alpine.data('xPopups', (data) => ({
        enable: false,
        showMinimal: false,
        show: Shopify.designMode ? ( localStorage.getItem(data.name + '-' + data.sectionId)? xParseJSON(localStorage.getItem(data.name + '-' + data.sectionId)) : true ) : false,
        delayDays: data.delayDays ? data.delayDays : 0,
        t: '',
        copySuccess: false,
        init() {
          if (Shopify.designMode) {
            var _this = this;
            const handlePopupSelect = (event, isResize = null) => {
              if (event.detail && event.detail.sectionId.includes(data.sectionId) || isResize) {
                if (window.Alpine) {
                  _this.open();
                  localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(true));
                } else {
                  document.addEventListener('alpine:initialized', () => {
                    _this.open();
                    localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(true));
                  });
                }
              } else {
                if (window.Alpine) {
                  _this.closeSection();
                  localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(false));
                } else {
                  document.addEventListener('alpine:initialized', () => {
                    _this.closeSection();
                    localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(false));
                  });
                }
              }
            }

            document.addEventListener('shopify:section:select', (event) => {
              handlePopupSelect(event);
            });
  
            document.addEventListener('shopify:block:select', (event) => {
              handlePopupSelect(event);
            });

            //reload popup and display overlay when change screen in shopify admin
            if (data.name != 'popup-age-verification') {
              window.addEventListener('resize', (event)=> {
                handlePopupSelect(event, xParseJSON(localStorage.getItem(data.name + '-' + data.sectionId)));
              })
            }
          }
  
          if (this.$el.querySelector('.newsletter-message')) {
            this.open();
            return;
          }
        },
        load() {
          //optimize popup load js
          if (window.location.pathname === '/challenge') return;

          const _this= this;
          if (Shopify.designMode) {
            _this.open();
          } else {
            if (data.name == 'popup-promotion' && !this.handleSchedule() && data.showCountdown) return;

            if (data.name == 'popup-promotion' && document.querySelector("#x-age-popup") && xParseJSON(localStorage.getItem('popup-age-verification')) == null) {
              document.addEventListener("close-age-verification", () => {
                setTimeout(() => {
                  _this.open();
                }, data.delays * 1000);
              })
              return;
            }

            setTimeout(() => {
              _this.open();
            }, data.delays * 1000);
          }
        },
        open() {
          if (!Shopify.designMode && this.isExpireSave() && !this.show) return;

          var _this = this;
          if (data.name == 'popup-age-verification') {
            if (this.isExpireSave() && !Shopify.designMode && !data.show_popup) return;

            requestAnimationFrame(() => {
              document.body.classList.add("overflow-hidden");
              Alpine.store('xPopup').open = true;
            });
          }

          //Show minimal when
          // 1. enable show minimal on desktop + default style = minimal + window width >= 768
          // 2. enable show minimal on mobile + default style mobile = minimal + window width < 768
          if ((data.showMinimal && data.default_style == "minimal" && window.innerWidth >= 768) 
            || (data.showMinimalMobile && data.default_style_mobile == "minimal" && window.innerWidth < 768)) {
            _this.showMinimal = true;
            _this.show = false;
            if (Shopify.designMode) {
              localStorage.setItem(data.name + '-' + data.sectionId, JSON.stringify(false));
              _this.removeOverlay();
            }
          } else {
            //Show full popup
            if (data.showOnMobile && window.innerWidth < 768 || window.innerWidth >= 768) {
              //Show a full popup for the first time accessing the site; if the customer closes the full popup, display a minimal popup during the session
              if (localStorage.getItem('current-' + data.sectionId) == 'minimal') {
                _this.showMinimal = true;
                _this.show = false;
                _this.removeOverlay();
              } else {
                _this.show = true;
                _this.showMinimal = false;
                _this.setOverlay();
                if (!Shopify.designMode) {
                  _this.saveDisplayedPopup();
                }
              }
            } else {
              //Show nothing when screen < 768 and disable show popup on mobile
              _this.removeOverlay();
            }
          }
        },
        close() {
          if (data.name == 'popup-age-verification') {
            this.show = false;
            requestAnimationFrame(() => {
              document.body.classList.remove("overflow-hidden");
              Alpine.store('xPopup').close();
            });
            document.dispatchEvent(new Event('close-age-verification'));
            return;
          }
          var _this = this;
          if (Shopify.designMode) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                _this.showMinimal = true;
              }, 300);
            });
          } else {
            this.removeDisplayedPopup();
            if ((data.showMinimal && window.innerWidth >= 768) || (data.showMinimalMobile && window.innerWidth < 768)) {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  _this.showMinimal = true;
                }, 300);
                //Save storage data when closing the full popup (the full popup only shows for the first time accessing the site).
                localStorage.setItem('current-' + data.sectionId, 'minimal');
              });
            } else {
              if (!this.isExpireSave()) {
                this.setExpire()
              }
            }
          }
          requestAnimationFrame(() => {
            setTimeout(() => {
              _this.show = false;
              _this.removeOverlay();
            }, 300);
          });
        },
        closeSection() {
          this.show = false;
          this.showMinimal = false;
          this.removeOverlay();
        },
        setExpire() {
          const item = {
            section: data.sectionId,
            expires: Date.now() + this.delayDays * 24 * 60 * 60 * 1000
          }
          
          localStorage.setItem(data.sectionId, JSON.stringify(item))
          //remove storage data, the full popup will be displayed when the site applies the reappear rule.
          localStorage.removeItem('current-' + data.sectionId);
        },
        isExpireSave() {
          const item = xParseJSON(localStorage.getItem(data.sectionId));
          if (item == null) return false;

          if (Date.now() > item.expires) {
            localStorage.removeItem(data.sectionId);
            return false;
          }

          return true;
        },
        handleSchedule() {
          if (data.showCountdown) {
            let el = document.getElementById('x-promotion-' + data.sectionId);
            let settings = xParseJSON(el.getAttribute('x-countdown-data'));
            if (!Alpine.store('xHelper').canShow(settings)) {
              if (!Shopify.designMode && data.schedule_enabled) {
                requestAnimationFrame(() => {
                  this.show = false;
                });

                return false;
              }
            }
          }

          this.enable = true;
          return true;
        },
        clickMinimal() {
          requestAnimationFrame(() => {
            this.show = true;
            this.showMinimal = false;
            if (!Shopify.designMode) {
              this.saveDisplayedPopup()
            }
            this.setOverlay();
          })
        },
        setOverlay() {
          let popupsDiv = document.querySelector("#eurus-popup");
          if (popupsDiv.classList.contains('bg-[#acacac]')) return
          if (data.overlay) {
            popupsDiv.className += ' bg-[#acacac] bg-opacity-30';
          }
        },
        removeOverlay() {
          let popupsDiv = document.querySelector("#eurus-popup")
            displayedPopups = xParseJSON(localStorage.getItem("promotion-popup")) || [];
          if (popupsDiv.classList.contains('bg-[#acacac]') && displayedPopups.length == 0) {
            popupsDiv.classList.remove('bg-[#acacac]', 'bg-opacity-30');
          }
        },
        //close minimal popup will set expired
        closeMinimal() {
          this.showMinimal = false;
          if (Shopify.designMode) return

          if (!this.isExpireSave()) this.setExpire();
        },
        saveDisplayedPopup() {
          let localStorageArray = xParseJSON(localStorage.getItem('promotion-popup')) || [];
          if (!localStorageArray.some(item => item == data.name + '-' + data.sectionId)) {
            localStorageArray.push(data.name + '-' + data.sectionId);
            localStorage.setItem('promotion-popup', JSON.stringify(localStorageArray));
          }
        },
        removeDisplayedPopup() {
          let localStorageArray = xParseJSON(localStorage.getItem('promotion-popup')),
            updatedArray = localStorageArray.filter(item => item != data.name + '-' + data.sectionId);
          localStorage.setItem('promotion-popup', JSON.stringify(updatedArray));
        },
      }))
    })
  })
}
