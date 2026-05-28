import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SsrGuard {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowserPlatform = isPlatformBrowser(this.platformId);

  /**
   * Check whether the application is currently executing inside the browser environment.
   */
  isBrowser(): boolean {
    return this.isBrowserPlatform;
  }

  /**
   * Safeguarded getter for 'window'. Returns undefined on the server, and the real window object on the browser.
   */
  get window(): Window | undefined {
    if (this.isBrowserPlatform) {
      return window;
    }
    return undefined;
  }

  /**
   * Safeguarded getter for 'document'. Returns undefined on the server, and the real document object on the browser.
   */
  get document(): Document | undefined {
    if (this.isBrowserPlatform) {
      return document;
    }
    return undefined;
  }

  /**
   * Safely execute a callback function only if running on the client (browser).
   */
  run<T>(callback: () => T): T | undefined {
    if (this.isBrowserPlatform) {
      try {
        return callback();
      } catch (e) {
        console.error('[SsrGuard] Error executing browser-only callback:', e);
      }
    }
    return undefined;
  }
}

