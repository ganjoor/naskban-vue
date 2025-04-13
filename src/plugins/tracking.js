// plugins/tracking.js
import { nextTick } from 'vue';

export default {
  install(app, options) {
    const config = {
      siteId: options?.siteId || "1",
      debug: options?.debug || false,
      maxTitleWait: 5000,
      titleCheckInterval: 200,
      initialLoadStatus: "initial_load",
      routeChangeStatus: "route_change"
    };

    const log = (...args) => config.debug && console.log('[Tracker]', ...args);

    // 1. Mandatory tracking initialization
    const initializeTracking = () => {
      try {
        if (window.kntrTracking) return;

        window.kntrTracking = {
          getOrCreateCookie: function(cookieName, isSessionCookie = false) {
            let cookieValue = this.getCookie(cookieName);
            if (!cookieValue) {
              cookieValue = this.generateUniqueId();
              let cookieSettings = `path=/; SameSite=None; Secure;`;
              if (!isSessionCookie) {
                const expirationDate = new Date();
                expirationDate.setFullYear(expirationDate.getFullYear() + 1);
                cookieSettings += `expires=${expirationDate.toUTCString()};`;
              }
              document.cookie = `${cookieName}=${cookieValue}; ${cookieSettings}`;
            }
            return cookieValue;
          },

          getCookie: function(name) {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
          },

          generateUniqueId: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          },

          startTracking: function(trackingId, siteSpecificUserHash = "") {
            const trackingApiUrl = `https://track.kntr.ir/tracking/${trackingId}`;
            const data = {
              url: window.location.href,
              referrer: document.referrer || '',
              title: document.title || '',
              platform: navigator.platform || '',
              screenWidth: window.screen.width || 0,
              screenHeight: window.screen.height || 0,
              viewPortWidth: window.innerWidth || 0,
              viewPortHeight: window.innerHeight || 0,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
              siteSpecificUserHash: siteSpecificUserHash,
              userUniqueId: this.getOrCreateCookie("KontorUserUniqueId"),
              sessionUniqueId: this.getOrCreateCookie("KontorSessionUniqueId", true)
            };

            fetch(trackingApiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
              credentials: "include"
            }).catch(error => log('Tracking error:', error));
          }
        };

        log('Tracking API initialized');
      } catch (error) {
        console.error('Tracking initialization failed:', error);
      }
    };

    // 2. Core tracking with verification
    const track = async (status) => {
      try {
        if (!window.kntrTracking?.startTracking) {
          throw new Error('Tracking API not initialized');
        }

        const startTime = Date.now();
        const initialTitle = document.title;

        const finalTitle = await new Promise((resolve) => {
          const check = () => {
            const currentTitle = document.title;
            if (currentTitle !== initialTitle || Date.now() - startTime > config.maxTitleWait) {
              resolve(currentTitle);
            } else {
              setTimeout(check, config.titleCheckInterval);
            }
          };
          check();
        });

        window.kntrTracking.startTracking(config.siteId, "");
        log('Tracked:', status, 'Title:', finalTitle);
      } catch (error) {
        log('Tracking failed:', error.message);
      }
    };

    // 3. Router integration
    const setupRouterTracking = (router) => {
      router.isReady().then(async () => {
        await track(config.initialLoadStatus);
      });

      router.afterEach(async (to) => {
        await track(`${config.routeChangeStatus}:${to.path}`);
      });
    };

    // 4. Initialization sequence
    initializeTracking(); // Synchronous initialization

    if (options?.router) {
      setupRouterTracking(options.router);
    } else {
      nextTick(() => track(config.initialLoadStatus));
    }
  }
};