import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SsrGuard {
  private platformId = inject(PLATFORM_ID);

  /**
   * Vérifie si l'application s'exécute actuellement dans le navigateur.
   * @returns true si dans le navigateur, false si sur le serveur (SSR)
   */
  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Exécute une fonction uniquement si l’application s'exécute dans le navigateur (côté client).
   * Utile pour encapsuler les accès à des objets spécifiques au client comme `window`, `document`, ou `localStorage`.
   * 
   * @param fn La fonction à exécuter sur le client
   * @returns Le résultat de la fonction, ou `undefined` si exécuté côté serveur
   * 
   * @example
   * const width = this.ssrGuard.run(() => window.innerWidth);
   */
  run<T>(fn: () => T): T | undefined {
    if (this.isBrowser()) {
      try {
        return fn();
      } catch (err) {
        console.error('[SsrGuard] Erreur lors de l\'exécution côté client :', err);
      }
    }
    return undefined;
  }
}
