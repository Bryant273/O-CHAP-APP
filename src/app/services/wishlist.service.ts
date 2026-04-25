import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private platformId = inject(PLATFORM_ID);
  private wishlistIds = signal<string[]>([]);

  public items$ = this.wishlistIds.asReadonly();

  public count = computed(() => this.wishlistIds().length);

  constructor() {
    this.loadWishlist();
  }

  toggleWishlist(productId: string) {
    this.wishlistIds.update(ids => {
      if (ids.includes(productId)) {
        return ids.filter(id => id !== productId);
      }
      return [...ids, productId];
    });
    this.saveWishlist();
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistIds().includes(productId);
  }

  private saveWishlist() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('oc_wishlist', JSON.stringify(this.wishlistIds()));
    }
  }

  private loadWishlist() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('oc_wishlist');
      if (saved) {
        try {
          this.wishlistIds.set(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load wishlist', e);
        }
      }
    }
  }
}
