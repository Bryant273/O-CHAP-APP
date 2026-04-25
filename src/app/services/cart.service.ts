import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private cartItems = signal<CartItem[]>([]);

  public items$ = this.cartItems.asReadonly();

  public totalItems = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  public subtotal = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  constructor() {
    this.loadCart();
  }

  addToCart(product: Record<string, unknown>) {
    this.cartItems.update(items => {
      const productId = product['id'] as string;
      const existing = items.find(i => i.id === productId);
      if (existing) {
        return items.map(i => i.id === productId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      const newItem: CartItem = {
        id: productId,
        name: product['name'] as string,
        price: product['price'] as number,
        quantity: 1,
        imageUrl: (product['imageUrl'] as string) || `https://picsum.photos/seed/${productId}/400`,
        category: (product['category'] as string) || 'Electronic'
      };
      return [...items, newItem];
    });
    this.saveCart();
  }

  removeFromCart(productId: string) {
    this.cartItems.update(items => items.filter(i => i.id !== productId));
    this.saveCart();
  }

  updateQuantity(productId: string, delta: number) {
    this.cartItems.update(items => {
      return items.map(i => {
        if (i.id === productId) {
          const newQty = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      });
    });
    this.saveCart();
  }

  clearCart() {
    this.cartItems.set([]);
    this.saveCart();
  }

  private saveCart() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('oc_cart', JSON.stringify(this.cartItems()));
    }
  }

  private loadCart() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('oc_cart');
      if (saved) {
        try {
          this.cartItems.set(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load cart', e);
        }
      }
    }
  }
}
