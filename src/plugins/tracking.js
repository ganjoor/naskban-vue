// plugins/tracking.js
import { nextTick } from 'vue';

export default {
  install(app, options) {
    const config = {
      siteId: options?.siteId || "1",
      debug: options?.debug || false,
      maxTitleWait: 10000, // 10 seconds max wait
      titleCheckInterval: 300, // Check every 300ms
      initialLoadStatus: "initial_load",
      routeChangeStatus: "route_change"
    };

    const log = (...args) => config.debug && console.log('[Tracker]', ...args);

    // 1. Embedded tracking implementation
    const initializeTracking = () => {
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
            referrer: document.referrer,
            title: document.title,
            platform: navigator.platform,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewPortWidth: window.innerWidth,
            viewPortHeight: window.innerHeight,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
    };

    // 2. Title stabilization checker
    const waitForTitleStabilization = (initialTitle) => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        
        const checkTitle = () => {
          const currentTitle = document.title;
          const elapsed = Date.now() - startTime;

          const shouldTrack = (
            currentTitle !== initialTitle ||
            elapsed > config.maxTitleWait ||
            (initialTitle === '' && currentTitle !== '')
          );

          if (shouldTrack) {
            resolve(currentTitle);
          } else {
            setTimeout(checkTitle, config.titleCheckInterval);
          }
        };

        checkTitle();
      });
    };

    // 3. Core tracking function
    const track = async (status) => {
      if (!window.kntrTracking?.startTracking) {
        log('Tracking API not available');
        return;
      }

      const initialTitle = document.title;
      const finalTitle = await waitForTitleStabilization(initialTitle);
      
      window.kntrTracking.startTracking(config.siteId, "");
      log('Tracked:', status, '| Initial Title:', initialTitle, '| Final Title:', finalTitle);
    };

    // 4. Router integration
    const setupRouterTracking = (router) => {
      let pendingNavigation = null;

      router.beforeEach((to, from, next) => {
        pendingNavigation = { to, resolve: next };
        next();
      });

      router.afterEach(async () => {
        if (!pendingNavigation) return;
        
        const { to } = pendingNavigation;
        pendingNavigation = null;
        
        await track(`${config.routeChangeStatus}:${to.path}`);
      });
    };

    // 5. Initialization sequence
    initializeTracking();

    // Track initial load after all components are mounted
    nextTick(async () => {
      await track(config.initialLoadStatus);
    });

    // Setup router tracking if provided
    if (options?.router) {
      setupRouterTracking(options.router);
    }
  }
};