// plugins/tracking.js
import { nextTick } from 'vue'

export default {
  install(app, options) {
    const config = {
      siteId: options?.siteId || '1',
      debug: true, // Keep debug enabled
      maxTitleWait: 5000,
      titleCheckInterval: 200,
      initialLoadStatus: 'initial_load',
      routeChangeStatus: 'route_change'
    }

    const log = (...args) => console.log('[Tracker]', ...args)
    let trackingQueue = new Set()

    // 1. Tracking implementation with full data
    const initializeTracking = () => {
      try {
        if (window.kntrTracking) return

        window.kntrTracking = {
          getOrCreateCookie: function (cookieName, isSessionCookie = false) {
            let cookieValue = this.getCookie(cookieName)
            if (!cookieValue) {
              cookieValue = this.generateUniqueId()
              let cookieSettings = `path=/; SameSite=None; Secure;`
              if (!isSessionCookie) {
                const expirationDate = new Date()
                expirationDate.setFullYear(expirationDate.getFullYear() + 1)
                cookieSettings += `expires=${expirationDate.toUTCString()};`
              }
              document.cookie = `${cookieName}=${cookieValue}; ${cookieSettings}`
            }
            return cookieValue
          },

          getCookie: function (name) {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
            return match ? match[2] : null
          },

          generateUniqueId: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
              const r = (Math.random() * 16) | 0
              const v = c === 'x' ? r : (r & 0x3) | 0x8
              return v.toString(16)
            })
          },

          startTracking: function (trackingId, siteSpecificUserHash = '') {
            const trackingApiUrl = `https://track.kntr.ir/tracking/${trackingId}`
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
              userUniqueId: this.getOrCreateCookie('KontorUserUniqueId'),
              sessionUniqueId: this.getOrCreateCookie('KontorSessionUniqueId', true)
            }

            log('Sending tracking data:', data)

            fetch(trackingApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
              credentials: 'include'
            }).catch((error) => log('Tracking error:', error))
          }
        }
        log('Tracking API initialized')
      } catch (error) {
        console.error('Tracking initialization failed:', error)
      }
    }

    // 2. Core tracking with queue management
    const track = async (status) => {
      if (trackingQueue.has(status)) {
        log('Tracking already in progress for:', status)
        return
      }

      trackingQueue.add(status)
      try {
        log('Starting tracking for:', status)
        const startTime = Date.now()
        const initialTitle = document.title

        // Wait for title stability or timeout
        await new Promise((resolve) => {
          const checkTitle = () => {
            const currentTitle = document.title
            const elapsed = Date.now() - startTime

            if (currentTitle !== initialTitle || elapsed > config.maxTitleWait) {
              log('Title stabilized:', currentTitle)
              resolve()
            } else {
              setTimeout(checkTitle, config.titleCheckInterval)
            }
          }
          checkTitle()
        })

        if (!window.kntrTracking?.startTracking) {
          throw new Error('Tracking API not available')
        }

        window.kntrTracking.startTracking(config.siteId, '')
        log('Tracking completed for:', status)
      } catch (error) {
        console.error('Tracking error:', error)
      } finally {
        trackingQueue.delete(status)
      }
    }

    // 3. Router integration with initial load handling
    const setupRouterTracking = (router) => {
      let isRouterReady = false

      router.isReady().then(async () => {
        isRouterReady = true
        log('Router ready, tracking initial load')
        await track(config.initialLoadStatus)
      })

      router.afterEach(async (to) => {
        if (!isRouterReady) return // Skip initial load handled separately

        log('Route changed to:', to.path)
        await track(`${config.routeChangeStatus}:${to.path}`)
      })
    }

    // 4. Initialization
    initializeTracking()

    if (options?.router) {
      log('Initializing with router')
      setupRouterTracking(options.router)
    } else {
      log('Initializing without router')
      nextTick(() => track(config.initialLoadStatus))
    }

    // Emergency fallback for home page
    setTimeout(() => {
      if (!trackingQueue.has(config.initialLoadStatus)) {
        log('Emergency home page tracking')
        track(config.initialLoadStatus)
      }
    }, config.maxTitleWait + 1000)
  }
}
