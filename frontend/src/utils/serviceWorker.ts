/**
 * Service Worker registration and management utilities
 * Handles offline capabilities and caching for the coding contest platform
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onError?: (error: Error) => void
}

interface CacheStats {
  [cacheName: string]: {
    count: number
    size: number
  }
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private isOnline = navigator.onLine
  private offlineQueue: Array<{ url: string; options: RequestInit }> = []

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener(
      'message',
      this.handleMessage.bind(this)
    )
  }

  /**
   * Register the service worker
   */
  async register(config: ServiceWorkerConfig = {}): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Register the service worker
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('Service Worker registered successfully')

        // Handle different states
        if (this.registration.installing) {
          console.log('Service Worker installing...')
          this.registration.installing.addEventListener('statechange', () => {
            if (this.registration?.installing?.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                config.onUpdate?.(this.registration)
              } else {
                // First install
                config.onSuccess?.(this.registration)
              }
            }
          })
        } else if (this.registration.waiting) {
          // Update available
          config.onUpdate?.(this.registration)
        } else if (this.registration.active) {
          // Service worker is active
          config.onSuccess?.(this.registration)
        }

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                config.onUpdate?.(this.registration!)
              }
            })
          }
        })
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        config.onError?.(error as Error)
      }
    } else {
      const error = new Error('Service Worker not supported')
      config.onError?.(error)
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (this.registration) {
      try {
        await this.registration.update()
        console.log('Service Worker updated')
      } catch (error) {
        console.error('Service Worker update failed:', error)
      }
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (this.registration) {
      try {
        const result = await this.registration.unregister()
        console.log('Service Worker unregistered')
        return result
      } catch (error) {
        console.error('Service Worker unregistration failed:', error)
        return false
      }
    }
    return false
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }

      navigator.serviceWorker?.controller?.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      )
    })
  }

  /**
   * Cache submission for offline sync
   */
  cacheSubmissionForOffline(submissionData: any): void {
    navigator.serviceWorker?.controller?.postMessage({
      type: 'CACHE_SUBMISSION',
      data: submissionData,
    })
  }

  /**
   * Check if the app is currently online
   */
  isAppOnline(): boolean {
    return this.isOnline
  }

  /**
   * Add request to offline queue
   */
  addToOfflineQueue(url: string, options: RequestInit): void {
    this.offlineQueue.push({ url, options })
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return

    console.log(`Processing ${this.offlineQueue.length} offline requests`)

    const queue = [...this.offlineQueue]
    this.offlineQueue = []

    for (const { url, options } of queue) {
      try {
        await fetch(url, options)
        console.log('Offline request processed:', url)
      } catch (error) {
        console.error('Failed to process offline request:', url, error)
        // Re-add to queue if failed
        this.offlineQueue.push({ url, options })
      }
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('App came online')
    this.isOnline = true
    this.processOfflineQueue()

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-online'))
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('App went offline')
    this.isOnline = false

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-offline'))
  }

  /**
   * Handle service worker messages
   */
  private handleMessage(event: MessageEvent): void {
    const { type, success } = event.data

    switch (type) {
      case 'SUBMISSION_SYNCED':
        if (success) {
          console.log('Offline submission synced successfully')
          // Dispatch custom event for UI updates
          window.dispatchEvent(
            new CustomEvent('submission-synced', {
              detail: { success },
            })
          )
        }
        break

      default:
        console.log('Unknown service worker message:', type)
    }
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager()

/**
 * Register service worker with default configuration
 */
export function registerServiceWorker(config?: ServiceWorkerConfig): void {
  // Only register in production or when explicitly enabled
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_SW_ENABLED === 'true'
  ) {
    serviceWorkerManager.register({
      onSuccess: (registration) => {
        console.log('SW registered successfully')
        config?.onSuccess?.(registration)
      },
      onUpdate: (registration) => {
        console.log('SW update available')
        config?.onUpdate?.(registration)

        // Show update notification
        if (
          window.confirm(
            'A new version is available. Would you like to update?'
          )
        ) {
          serviceWorkerManager.skipWaiting()
          window.location.reload()
        }
      },
      onError: (error) => {
        console.error('SW registration failed:', error)
        config?.onError?.(error)
      },
    })
  }
}

/**
 * Unregister service worker
 */
export function unregisterServiceWorker(): Promise<boolean> {
  return serviceWorkerManager.unregister()
}

/**
 * Update service worker
 */
export function updateServiceWorker(): Promise<void> {
  return serviceWorkerManager.update()
}

/**
 * Skip waiting for new service worker
 */
export function skipWaiting(): void {
  serviceWorkerManager.skipWaiting()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): Promise<CacheStats> {
  return serviceWorkerManager.getCacheStats()
}

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  return serviceWorkerManager.isAppOnline()
}

/**
 * Cache submission for offline processing
 */
export function cacheOfflineSubmission(submissionData: any): void {
  serviceWorkerManager.cacheSubmissionForOffline(submissionData)
}

/**
 * Enhanced fetch with offline support
 */
export async function fetchWithOfflineSupport(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    // If offline and it's a POST request, cache it
    if (!serviceWorkerManager.isAppOnline() && options.method === 'POST') {
      serviceWorkerManager.addToOfflineQueue(url, options)

      // Return a mock response
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Request queued for when online',
          offline: true,
        }),
        {
          status: 202,
          statusText: 'Accepted (Offline)',
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    throw error
  }
}

// Export the manager instance for advanced usage
export { serviceWorkerManager }

// Default export
export default {
  register: registerServiceWorker,
  unregister: unregisterServiceWorker,
  update: updateServiceWorker,
  skipWaiting,
  getCacheStats,
  isOnline,
  cacheOfflineSubmission,
  fetchWithOfflineSupport,
}
