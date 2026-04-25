import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy, computed, PLATFORM_ID, HostListener, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { DataService } from '../../services/data.service';
import { Unsubscribe } from 'firebase/firestore';

type PanelType = 'none' | 'cart' | 'wishlist' | 'orders' | 'profile';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface flex flex-col font-sans">
      
      <!-- Overlay for mobile/sidebar -->
      <div class="oc-overlay" 
           [class.oc-overlay-hidden]="activePanel() === 'none' && !mobileMenuOpen()" 
           (click)="closeAllPanels()" 
           (keydown.escape)="closeAllPanels()" 
           tabindex="-1"
           role="presentation"></div>

      <!-- Top Header -->
      <header class="header">
        <div class="flex items-center gap-2">
          <button (click)="toggleSidebar()" class="icon-btn" aria-label="Toggle sidebar">
            <mat-icon>{{sidebarCollapsed() ? 'menu' : 'menu_open'}}</mat-icon>
          </button>
          
          <button (click)="mobileMenuOpen.set(!mobileMenuOpen())" class="icon-btn lg:hidden" aria-label="Toggle mobile menu">
            <mat-icon>{{mobileMenuOpen() ? 'close' : 'menu'}}</mat-icon>
          </button>
  
          <a routerLink="/" class="flex items-center gap-2 no-underline">
            <div class="font-display font-black text-2xl text-dark tracking-tighter uppercase leading-none italic shadow-primary/20">O'<span class="text-primary">CHAP</span></div>
          </a>
        </div>

        <div class="hidden md:flex flex-1 max-w-xl relative mx-4">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-muted scale-75">search</mat-icon>
          <input type="text" 
                 [(ngModel)]="searchQueryInput"
                 (input)="searchQuery.set(searchQueryInput)"
                 placeholder="Réfrigérateurs, TV, Climatiseurs..." 
                 class="w-full h-10 border-1.5 border-surface-2 rounded-full bg-surface pl-10 pr-4 text-sm font-sans outline-none focus:border-primary focus:bg-white-soft transition-all">
        </div>

        <div class="flex items-center gap-1 ml-auto">
          <button (click)="toggleNotificationMenu($event)" class="icon-btn relative" title="Notifications">
             <mat-icon class="scale-90">notifications_none</mat-icon>
             @if (unreadNotifsCount() > 0) {
               <span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white-soft"></span>
             }

             <!-- Notification Modal/Dropdown -->
             @if (notificationMenuOpen()) {
                <div class="absolute right-0 mt-12 w-80 bg-white rounded-2xl shadow-2xl border border-surface-2 z-[2000] overflow-hidden animate-fade-up-short text-left cursor-default outline-none" 
                     (click)="$event.stopPropagation()"
                     (keydown)="$event.stopPropagation()"
                     tabindex="-1">
                   <div class="px-5 py-4 border-b border-surface-2 flex items-center justify-between">
                      <h3 class="text-[11px] font-black uppercase tracking-widest text-dark">Notifications</h3>
                      @if (unreadNotifsCount() > 0) {
                         <span class="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded">{{unreadNotifsCount()}} Nouveau</span>
                      }
                   </div>
                   
                   <div class="max-h-[350px] overflow-y-auto no-scrollbar">
                      @for (n of notifications().slice(0, 5); track n['id']) {
                         <div class="p-4 border-b border-surface-2 hover:bg-surface transition-colors cursor-pointer focus:outline-none focus:bg-surface-2" 
                              [class.bg-primary/5]="!n['read']" 
                              tabindex="0"
                              (click)="markAsRead(asString(n['id']))"
                              (keydown.enter)="markAsRead(asString(n['id']))">
                            <div class="flex gap-3">
                               <div class="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                                  <mat-icon class="scale-50 text-muted">{{ getNotifIcon(asString(n['type'])) }}</mat-icon>
                               </div>
                               <div class="min-w-0">
                                  <p class="text-[10px] font-bold text-dark truncate">{{ n['title'] }}</p>
                                  <p class="text-[9px] text-muted line-clamp-2 leading-relaxed">{{ n['message'] }}</p>
                               </div>
                            </div>
                         </div>
                      } @empty {
                         <div class="py-8 text-center opacity-30">
                            <mat-icon class="scale-110 mb-2">notifications_none</mat-icon>
                            <p class="text-[10px] font-bold uppercase tracking-widest">Aucune alerte</p>
                         </div>
                      }
                   </div>

                   <a routerLink="/notifications" class="block w-full py-3 text-center text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all">
                      Voir toutes les notifications
                   </a>
                </div>
             }
          </button>

          <button (click)="openPanel('wishlist')" class="icon-btn" title="Favoris">
            <mat-icon class="scale-90">favorite_border</mat-icon>
            @if (wishlistItemsCount()) {
              <span class="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white-soft"></span>
            }
          </button>
          
          <button (click)="openPanel('cart')" class="icon-btn" title="Panier">
            <mat-icon class="scale-90">shopping_bag</mat-icon>
            @if (cartItemsCount()) {
              <span class="oc-badge">{{ cartItemsCount() }}</span>
            }
          </button>

          <div class="hidden sm:block relative">
            @if (authService.user$()) {
              <div class="relative">
                <button (click)="toggleUserMenu($event)" class="w-8 h-8 rounded-full overflow-hidden border border-surface-2 ml-2 hover:border-primary transition-all cursor-pointer">
                  @if (authService.user$()?.photoURL) {
                    <img [src]="authService.user$()?.photoURL" alt="Avatar" class="w-full h-full object-cover">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center bg-dark text-white-soft text-[10px] font-bold">
                      {{authService.user$()?.displayName?.charAt(0)}}
                    </div>
                  }
                </button>

                <!-- User Dropdown Menu -->
                @if (userMenuOpen()) {
                  <div class="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-surface-2 z-[2000] overflow-hidden animate-fade-up-short">
                    <div class="px-5 py-4 border-b border-surface-2 bg-surface-3">
                      <p class="text-[11px] font-black text-dark truncate uppercase tracking-wider mb-0.5">{{ authService.user$()?.displayName }}</p>
                      <p class="text-[9px] text-muted truncate font-mono">{{ authService.user$()?.email }}</p>
                      <div class="mt-2 inline-block px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded">
                        Option {{ asString(authService.profile$()?.['role'] || '').toUpperCase() }}
                      </div>
                    </div>
                    
                    <div class="p-2 flex flex-col gap-1">
                      <button routerLink="/profile" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-ink/70 hover:bg-surface-2 hover:text-primary transition-all cursor-pointer">
                        <mat-icon class="scale-75">person_outline</mat-icon>
                        <span>Mon Profil</span>
                      </button>
                      <button routerLink="/orders" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-ink/70 hover:bg-surface-2 hover:text-primary transition-all cursor-pointer">
                        <mat-icon class="scale-75">receipt_long</mat-icon>
                        <span>Mes Commandes</span>
                      </button>
                      <button routerLink="/notifications" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-ink/70 hover:bg-surface-2 hover:text-primary transition-all cursor-pointer">
                        <mat-icon class="scale-75">notifications</mat-icon>
                        <span>Mes Notifications</span>
                      </button>

                      @if (authService.profile$()?.['role'] === 'admin') {
                        <div class="h-px bg-surface-2 my-1 mx-3"></div>
                        <button routerLink="/admin/dashboard" (click)="userMenuOpen.set(false)" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-surface-2 transition-all cursor-pointer">
                          <mat-icon class="scale-75">dashboard</mat-icon>
                          <span class="font-bold">Tableau de Bord ERP</span>
                        </button>
                      }

                      @if (authService.profile$()?.['role'] === 'fournisseur' || authService.profile$()?.['role'] === 'admin') {
                        <button [routerLink]="authService.profile$()?.['role'] === 'admin' ? '/admin/inventory' : '/supplier/inventory'" (click)="userMenuOpen.set(false)" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-navy hover:bg-surface-2 transition-all cursor-pointer">
                          <mat-icon class="scale-75">inventory_2</mat-icon>
                          <span class="font-bold">Gestion Inventaire</span>
                        </button>
                      }

                      <div class="h-px bg-surface-2 my-1 mx-3"></div>
                      <button (click)="handleLogout()" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                        <mat-icon class="scale-75">logout</mat-icon>
                        <span class="font-bold">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <button routerLink="/auth/login" class="btn-login ml-2">Connexion</button>
            }
          </div>
        </div>
      </header>

      <!-- Main Shell -->
      <div class="flex flex-1 relative overflow-hidden">
        
        <!-- Sidebar Navigation -->
        <aside class="sidebar" [class.open]="mobileMenuOpen()" [class.collapsed]="sidebarCollapsed()">
          <div class="h-full flex flex-col pt-2 pb-6">
            
            <div class="px-6 py-4 flex lg:hidden items-center justify-between border-b border-surface-2 mb-4">
              <div class="font-display font-black text-xl tracking-tighter uppercase italic">O'<span class="text-primary">CHAP</span></div>
              <button (click)="mobileMenuOpen.set(false)" class="icon-btn"><mat-icon>close</mat-icon></button>
            </div>

            <nav class="flex-1 overflow-y-auto no-scrollbar px-3 flex flex-col gap-1">
              <button (click)="selectCategory('all')" 
                      [class.sidebar-item-active]="selectedCategory() === 'all'"
                      class="sidebar-item">
                <mat-icon>dashboard</mat-icon>
                <span>Accueil</span>
              </button>

              <div class="mt-4 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted/60">Rayons</div>

              @for (group of categories; track group.id) {
                <div class="flex flex-col">
                  <button (click)="toggleGroup(group.id)" 
                          class="sidebar-item w-full justify-between"
                          [class.text-primary]="selectedCategory().startsWith(group.id.split('-')[1])">
                    <div class="flex items-center gap-3">
                      <mat-icon>{{group.icon}}</mat-icon>
                      <span>{{group.name}}</span>
                    </div>
                    <mat-icon class="transition-transform duration-300" 
                              [class.rotate-180]="openGroups()[group.id]">
                      expand_more
                    </mat-icon>
                  </button>

                  <div class="overflow-hidden transition-all duration-300"
                       [class.max-h-0]="!openGroups()[group.id]"
                       [class.max-h-96]="openGroups()[group.id]">
                    <div class="flex flex-col pl-11 py-1 gap-1">
                      @for (item of group.items; track item.id) {
                        <button (click)="selectCategory(item.id)" 
                                [class.sidebar-sub-item-active]="selectedCategory() === item.id"
                                class="sidebar-sub-item">
                          {{item.name}}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }

              <div class="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted/60">Compte</div>
              
              <button routerLink="/orders" 
                      routerLinkActive="sidebar-item-active"
                      class="sidebar-item">
                <mat-icon>receipt_long</mat-icon>
                <span>Mes Commandes</span>
              </button>

              @if (authService.profile$()?.['role'] === 'admin') {
                <button routerLink="/admin/dashboard" class="sidebar-item text-primary bg-primary/5 border border-primary/10 mt-2">
                  <mat-icon>dashboard</mat-icon>
                  <span class="font-bold">Tableau de Bord ERP</span>
                </button>
              }

              @if (authService.profile$()?.['role'] === 'fournisseur' || authService.profile$()?.['role'] === 'admin') {
                <button [routerLink]="authService.profile$()?.['role'] === 'admin' ? '/admin/inventory' : '/supplier/inventory'" class="sidebar-item text-navy bg-navy/5 border border-navy/10 mt-1">
                  <mat-icon>inventory_2</mat-icon>
                  <span class="font-bold">Gestion Inventaire</span>
                </button>
              }
            </nav>

            <!-- Promo/Help Card -->
            <div class="px-4 mt-6">
              <div class="bg-dark rounded-2xl p-5 text-white-soft relative overflow-hidden group">
                <div class="relative z-10">
                  <div class="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Service Client</div>
                  <div class="text-sm font-medium leading-tight mb-4">Besoin d'aide pour choisir ?</div>
                  <a href="tel:+22501020304" class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold transition-transform active:scale-95">
                    <mat-icon class="scale-75">call</mat-icon>
                    Appeler
                  </a>
                </div>
                <mat-icon class="absolute -right-4 -bottom-4 text-white/5 scale-[4] rotate-12 group-hover:rotate-0 transition-transform duration-700">headset_mic</mat-icon>
              </div>
            </div>

          </div>
        </aside>

        <!-- Main Content area -->
        <main class="main-content">
          
          <div class="max-w-7xl mx-auto">
            
            <!-- Welcome Header -->
            <div class="mb-10 animate-fade-up">
              <h1 class="text-4xl lg:text-5xl font-display font-extrabold text-dark tracking-tight mb-2">
                @if (selectedCategory() === 'all') { Panier d'Antan, <span class="text-primary">Confort d'aujourd'hui.</span> }
                @else { {{ asString(selectedCategory().toUpperCase()) }} }
              </h1>
              <p class="text-muted text-lg max-w-2xl leading-relaxed">Découvrez l'excellence de l'électroménager premium à Abidjan. Innovation, design et service certifié pour votre intérieur.</p>
            </div>

            <!-- Featured/Promo Section -->
            @if (featuredProducts().length > 0) {
              <div class="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style="animation-delay: 0.1s">
                @for (prod of featuredProducts(); track prod['id']; let first = $first) {
                  <div class="group relative overflow-hidden rounded-xl bg-dark border border-border shadow-oc h-[350px] lg:h-[400px]">
                    
                    <img [src]="asString(prod['imageUrl']) || 'https://picsum.photos/seed/'+prod['id']+'/800'" 
                         class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                         referrerpolicy="no-referrer"
                         [alt]="asString(prod['name'])">
                    
                    <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent p-8 flex flex-col justify-end text-white">
                      <div class="flex items-center gap-2 mb-3">
                         <span class="px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                           {{ prod['isPromo'] ? 'PROMOTION' : 'NOUVEAUTÉ' }}
                         </span>
                      </div>
                      
                      <h2 class="text-2xl font-display font-extrabold mb-2 tracking-tight">
                        {{ prod['name'] }}
                      </h2>
                      
                      <p class="text-white/70 mb-6 text-sm line-clamp-2 max-w-sm">
                        {{ prod['description'] || 'Innovation et design certifié O’CHAP pour votre intérieur.' }}
                      </p>
  
                      <div class="flex items-center justify-between">
                         <div class="flex flex-col">
                            <span class="text-primary text-2xl font-bold">{{ prod['price'] }} <small class="text-[10px] opacity-60 uppercase font-sans">FCFA</small></span>
                         </div>
                         
                         <button (click)="addToCart($event, prod)" class="bg-primary hover:bg-white hover:text-dark px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95">
                           Ajouter
                         </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
               <div class="mb-12 bg-white-soft rounded-[2rem] p-16 border-2 border-dashed border-surface-2 flex flex-col items-center justify-center text-center group">
                  <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                     <mat-icon class="text-primary opacity-40">auto_awesome</mat-icon>
                  </div>
                  <h3 class="text-xl font-display font-medium text-dark mb-2">Explorez l'Univers O'CHAP.</h3>
                  <p class="text-muted text-sm max-w-xs">Nos produits en vogue apparaîtront ici. Ajoutez des produits via l'inventaire pour activer cet espace.</p>
               </div>
            }
  
            <!-- Catalogue Section -->
            <div class="flex flex-col gap-6 mb-10 pt-6">
               <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 class="text-2xl font-display font-extrabold text-dark tracking-tight leading-none mb-1">Nos <span class="text-primary">Incontournables.</span></h2>
                    <p class="text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-60">SÉLECTION PREMIUM — ABIDJAN & LIBREVILLE</p>
                  </div>
                  <div class="flex items-center gap-3">
                     <button (click)="filtersExpanded.set(!filtersExpanded())" class="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white border border-border hover:border-primary transition-all group shadow-sm active:scale-95">
                        <mat-icon class="scale-75 text-muted group-hover:text-primary">tune</mat-icon>
                        <span class="text-[10px] font-bold uppercase tracking-widest text-dark">{{filtersExpanded() ? 'Cacher Filtres' : 'Filtres'}}</span>
                     </button>
                     <div class="relative">
                       <select [ngModel]="selectedSort()" (ngModelChange)="selectedSort.set($event)" class="bg-white border border-border rounded-lg px-6 py-2 text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer focus:border-primary transition-all appearance-none pr-10 shadow-sm">
                          <option value="default">TRI: DÉFAUT</option>
                          <option value="cheap">PRIX: CROISSANT</option>
                          <option value="expensive">PRIX: DÉCROISSANT</option>
                       </select>
                       <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-muted scale-50 pointer-events-none">expand_more</mat-icon>
                     </div>
                  </div>
               </div>
  
               <!-- Expandable Filters -->
               <div class="bg-white-soft border border-surface-2 rounded-3xl overflow-hidden shadow-sm transition-all duration-500"
                    [class.max-h-0]="!filtersExpanded()"
                    [class.opacity-0]="!filtersExpanded()"
                    [class.py-0]="!filtersExpanded()"
                    [class.p-8]="filtersExpanded()">
                  
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <div class="space-y-4">
                        <h4 class="text-[10px] font-bold uppercase text-dark tracking-widest">Budget (FCFA)</h4>
                        <div class="flex items-center gap-4">
                           <div class="flex-1">
                              <label for="price-min" class="text-[8px] font-bold text-muted uppercase block mb-1 font-sans">Min</label>
                              <input id="price-min" type="number" [(ngModel)]="priceRange().min" (input)="updatePrice(priceRange().min, priceRange().max)" class="w-full bg-white border border-surface-2 rounded-lg px-3 py-2 text-xs font-sans focus:ring-1 focus:ring-primary outline-none">
                           </div>
                           <div class="flex-1">
                              <label for="price-max" class="text-[8px] font-bold text-muted uppercase block mb-1 font-sans">Max</label>
                              <input id="price-max" type="number" [(ngModel)]="priceRange().max" (input)="updatePrice(priceRange().min, priceRange().max)" class="w-full bg-white border border-surface-2 rounded-lg px-3 py-2 text-xs font-sans focus:ring-1 focus:ring-primary outline-none">
                           </div>
                        </div>
                     </div>
  
                      <div class="space-y-4 md:col-start-4">
                        <h4 class="text-[10px] font-bold uppercase text-dark tracking-widest font-display">Disponibilité</h4>
                        <label class="flex items-center gap-3 cursor-pointer group">
                           <div class="w-10 h-6 rounded-full relative transition-all duration-300 shadow-inner" 
                                [class.bg-emerald-500]="onlyInStock()"
                                [class.bg-slate-300]="!onlyInStock()">
                              <input type="checkbox" [(ngModel)]="onlyInStock" class="hidden">
                              <div class="absolute w-4 h-4 bg-white rounded-full top-1 left-1 transition-all duration-300 shadow-sm" [style.transform]="onlyInStock() ? 'translateX(16px)' : ''"></div>
                           </div>
                           <span class="text-[10px] font-bold uppercase tracking-wider transition-colors font-sans"
                                 [class.text-emerald-700]="onlyInStock()"
                                 [class.text-muted]="!onlyInStock()">
                             {{ onlyInStock() ? 'En stock uniquement' : 'Tous les produits' }}
                           </span>
                        </label>
                     </div>
                  </div>
               </div>
            </div>
  
            <!-- Grid Layout -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              @for (p of sortedProducts(); track p['id']) {
                <div class="product-card group" [routerLink]="['/products', p['id']]">
                  <div class="product-card-image">
                    <img [src]="p['imageUrl'] || 'https://picsum.photos/seed/'+p['id']+'/400/500'" 
                         [alt]="asString(p['name'])"
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerpolicy="no-referrer">
                    
                    @if (p['isPromo']) {
                      <div class="absolute top-3 left-3 bg-primary text-white-soft text-[8px] font-bold px-2 py-1 rounded-full uppercase shadow-oc">PROMO</div>
                    }
  
                    <div class="product-card-actions">
                      <button (click)="toggleWishlist($event, p)" 
                              [class.text-primary]="isInWishlist(asString(p['id']))"
                              class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-oc hover:bg-primary hover:text-white transition-all">
                        <mat-icon class="scale-[0.6]">{{ isInWishlist(asString(p['id'])) ? 'favorite' : 'favorite_border' }}</mat-icon>
                      </button>
                      <button (click)="addToCart($event, p)" class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-dark hover:bg-dark hover:text-white transition-all shadow-oc">
                        <mat-icon class="scale-[0.6]">add_shopping_cart</mat-icon>
                      </button>
                    </div>
                  </div>
  
                  <div class="mt-4 flex flex-col items-center text-center px-1 pb-4">
                     <p class="text-[9px] font-bold text-muted uppercase tracking-widest mb-1 opacity-60">{{p['category']}}</p>
                     <h3 class="text-sm font-medium text-dark leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-1 truncate w-full">{{p['name']}}</h3>
                     <p class="text-base font-mono text-primary mb-3">{{p['price']}} <small class="text-[10px] opacity-60">FCFA</small></p>
                     
                     <div class="flex items-center justify-center pt-2">
                        <button class="px-5 py-2 rounded-full border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all transform group-hover:translate-y-[-2px] shadow-sm hover:shadow-primary/20">
                          Voir plus
                        </button>
                     </div>
                  </div>
                </div>
              } @empty {
                <div class="col-span-full py-24 flex flex-col items-center justify-center text-center opacity-20">
                   <mat-icon class="scale-[3] mb-4">inventory_2</mat-icon>
                   <p class="font-display font-medium text-lg">Aucun produit trouvé.</p>
                </div>
              }
            </div>
          </div>

          <!-- Branded Footer -->
          <footer class="bg-dark text-white-soft/60 py-16 px-6 lg:px-12 mt-auto border-t border-white/5">
            <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
               <div class="col-span-1">
                  <div class="font-display font-black text-2xl text-white-soft mb-4 tracking-tighter uppercase italic">O'<span class="text-primary">CHAP</span></div>
                  <p class="text-sm leading-relaxed opacity-60 mb-6 font-sans">L'excellence de l'électroménager premium à Abidjan. Innovation, design et service certifié pour votre intérieur.</p>
               </div>
               <div>
                  <h4 class="text-white-soft text-[10px] font-bold uppercase tracking-[0.2em] mb-6 opacity-40">Univers</h4>
                  <nav class="flex flex-col gap-3 text-xs font-medium">
                     <a routerLink="/cuisine" class="hover:text-primary transition-colors cursor-pointer">Cuisine</a>
                     <a routerLink="/salon" class="hover:text-primary transition-colors cursor-pointer">Salon</a>
                     <a routerLink="/linge" class="hover:text-primary transition-colors cursor-pointer">Linge</a>
                  </nav>
               </div>
               <div>
                  <h4 class="text-white-soft text-[10px] font-bold uppercase tracking-[0.2em] mb-6 opacity-40">Services</h4>
                  <nav class="flex flex-col gap-3 text-xs font-medium">
                     <a class="hover:text-primary transition-colors cursor-pointer">SAV & Garanties</a>
                     <button (click)="showReturnsPolicy.set(true)" (keydown.enter)="showReturnsPolicy.set(true)" class="text-left hover:text-primary transition-colors cursor-pointer text-primary bg-primary/5 px-2 py-0.5 rounded-md -ml-2">Politique de Retour</button>
                     <a class="hover:text-primary transition-colors cursor-pointer">Livraison</a>
                     <a class="hover:text-primary transition-colors cursor-pointer">Financement</a>
                  </nav>
               </div>
               <div>
                  <h4 class="text-white-soft text-[10px] font-bold uppercase tracking-[0.2em] mb-6 opacity-40">Newsletter</h4>
                  <div class="flex gap-2 h-11">
                     <input type="email" placeholder="Votre email" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-none focus:border-primary/50 text-white transition-all">
                     <button class="w-11 bg-primary text-white flex items-center justify-center rounded-xl hover:bg-primary-dark transition-all active:scale-95">
                       <mat-icon class="scale-90">send</mat-icon>
                     </button>
                  </div>
               </div>
            </div>
            <div class="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <p class="text-[10px] font-medium opacity-50 tracking-wide font-sans">&copy; 2026 O'Chap Group. Tous droits réservés.</p>
              <div class="flex gap-4">
                <mat-icon class="cursor-pointer hover:text-primary transition-colors scale-90">facebook</mat-icon>
                <mat-icon class="cursor-pointer hover:text-primary transition-colors scale-90">language</mat-icon>
              </div>
            </div>
          </footer>
        </main>
      </div>

      <!-- Mobile Nav -->
      <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-surface-2 flex items-center justify-around h-16 z-[1600] px-2 pb-safe shadow-oc">
          <button (click)="selectCategory('all')" 
                  class="flex flex-col items-center gap-1 flex-1 py-1"
                  [class.text-primary]="activePanel() === 'none' && !mobileMenuOpen()">
            <mat-icon class="scale-90">explore</mat-icon>
            <span class="text-[9px] font-bold uppercase tracking-tight">Home</span>
          </button>
          <button (click)="openPanel('wishlist')" 
                  class="flex flex-col items-center gap-1 flex-1 py-1 text-muted transition-colors"
                  [class.text-primary]="activePanel() === 'wishlist'">
            <mat-icon class="scale-90">favorite</mat-icon>
            <span class="text-[9px] font-bold uppercase tracking-tight">Favoris</span>
          </button>
          <button (click)="openPanel('cart')" 
                  class="flex flex-col items-center gap-1 flex-1 py-1 text-muted transition-colors relative"
                  [class.text-primary]="activePanel() === 'cart'">
            <mat-icon class="scale-90">shopping_bag</mat-icon>
            @if (cartItemsCount()) { <span class="absolute top-1 right-5 w-4 h-4 bg-primary text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm">{{cartItemsCount()}}</span> }
            <span class="text-[9px] font-bold uppercase tracking-tight">Panier</span>
          </button>
          <button (click)="openPanel('profile')" 
                  class="flex flex-col items-center gap-1 flex-1 py-1 text-muted transition-colors"
                  [class.text-primary]="activePanel() === 'profile'">
            <mat-icon class="scale-90">account_circle</mat-icon>
            <span class="text-[9px] font-bold uppercase tracking-tight">Profil</span>
          </button>
      </nav>

      <!-- SIDE PANELS -->
      
      <!-- Returns Policy Modal -->
      @if (showReturnsPolicy()) {
        <div class="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-dark/60 backdrop-blur-sm" (click)="showReturnsPolicy.set(false)" (keydown.escape)="showReturnsPolicy.set(false)" role="button" aria-label="Close modal" tabindex="0"></div>
          <div class="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-surface-2 overflow-hidden animate-fade-up-short">
            <div class="p-8 border-b border-surface-2 flex items-center justify-between bg-surface-3">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <mat-icon>assignment_return</mat-icon>
                </div>
                <div>
                  <h3 class="text-xl font-display font-bold text-dark tracking-tight">Politique de Retour</h3>
                  <p class="text-[10px] font-black uppercase text-muted tracking-widest">O'CHAP Afrique — Abidjan & Libreville</p>
                </div>
              </div>
              <button (click)="showReturnsPolicy.set(false)" class="w-10 h-10 rounded-full hover:bg-surface-2 transition-all flex items-center justify-center text-muted">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <div class="p-8 max-h-[60vh] overflow-y-auto no-scrollbar space-y-6">
              <section>
                <h4 class="text-xs font-black uppercase tracking-widest text-primary mb-3">Droit de Rétractation</h4>
                <p class="text-[13px] leading-relaxed text-ink/80 font-medium font-sans">
                  Chez O'CHAP, nous nous engageons sur la qualité. Si votre article ne vous donne pas entière satisfaction, vous disposez d'un délai de **14 jours** suivant la réception pour nous le retourner sans justification.
                </p>
              </section>

              <section>
                <h4 class="text-xs font-black uppercase tracking-widest text-primary mb-3 text-emerald-600">Conditions de Retour</h4>
                <ul class="space-y-3">
                  <li class="flex items-start gap-3">
                    <mat-icon class="text-emerald-500 scale-75 shrink-0">check_circle</mat-icon>
                    <span class="text-[12px] font-medium text-ink/70 font-sans">L'article doit être dans son emballage d'origine scellé.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <mat-icon class="text-emerald-500 scale-75 shrink-0">check_circle</mat-icon>
                    <span class="text-[12px] font-medium text-ink/70 font-sans">Toutes les protections de transport et films plastiques doivent être intacts.</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <mat-icon class="text-emerald-500 scale-75 shrink-0">check_circle</mat-icon>
                    <span class="text-[12px] font-medium text-ink/70 font-sans">La preuve d'achat (facture numérique ou papier) est obligatoire.</span>
                  </li>
                </ul>
              </section>

              <section>
                <h4 class="text-xs font-black uppercase tracking-widest text-primary mb-3">Échange & Remboursement</h4>
                <p class="text-[13px] leading-relaxed text-ink/80 font-medium font-sans">
                  Après inspection de l'article dans nos centres O'CHAP logistiques d'Abidjan ou Libreville, le remboursement sera effectué sous 48h via le mode de paiement initial ou sous forme de bon d'achat O'CHAP.
                </p>
              </section>
            </div>

            <div class="p-8 border-t border-surface-2 bg-surface-3 flex flex-col sm:flex-row items-center gap-4">
              <a href="tel:+22501020304" class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-all">
                <mat-icon class="scale-75">phone_in_talk</mat-icon>
                Contacter un conseiller
              </a>
              <button (click)="showReturnsPolicy.set(false)" class="sm:ml-auto w-full sm:w-auto h-12 px-8 bg-dark text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-dark/20 hover:bg-primary transition-all active:scale-95">
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Shopping Cart Panel -->
      <div class="oc-panel shadow-oc-lg" [class.oc-panel-hidden]="activePanel() !== 'cart'">
         <div class="p-6 border-b border-surface-2 flex items-center justify-between">
            <h3 class="text-xl font-display font-medium text-dark">Votre Panier <span class="text-primary text-sm font-sans font-bold ml-2">({{cartItemsCount()}})</span></h3>
            <button (click)="closeAllPanels()" class="icon-btn" aria-label="Fermer"><mat-icon>close</mat-icon></button>
         </div>

         <div class="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            @for (item of cartItems(); track item.id) {
               <div class="flex gap-4 group">
                  <div class="w-20 h-24 bg-white rounded-xl overflow-hidden shrink-0 border border-surface-2">
                     <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                  </div>
                  <div class="flex-1 min-w-0 flex flex-col">
                     <div class="flex items-start justify-between gap-2 mb-1">
                        <h4 class="text-sm font-medium text-dark leading-tight line-clamp-2">{{item.name}}</h4>
                        <button (click)="removeFromCart(item.id)" class="text-muted hover:text-red-500 transition-colors" title="Retirer"><mat-icon class="scale-75">delete_outline</mat-icon></button>
                     </div>
                     <p class="text-xs font-mono text-primary mb-3">{{item.price}} FCFA</p>
                     
                     <div class="mt-auto flex items-center">
                        <div class="flex items-center bg-white border border-surface-2 rounded-lg overflow-hidden h-8">
                           <button (click)="updateQty(item.id, -1)" class="w-8 h-8 flex items-center justify-center hover:bg-surface transition-all text-muted" aria-label="Moins"><mat-icon class="scale-75">remove</mat-icon></button>
                           <span class="w-8 flex items-center justify-center text-xs font-bold font-sans">{{item.quantity}}</span>
                           <button (click)="updateQty(item.id, 1)" class="w-8 h-8 flex items-center justify-center hover:bg-surface transition-all text-muted" aria-label="Plus"><mat-icon class="scale-75">add</mat-icon></button>
                        </div>
                     </div>
                  </div>
               </div>
            } @empty {
               <div class="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <mat-icon class="scale-[3] mb-6">shopping_bag</mat-icon>
                  <p class="text-lg font-display font-medium mb-1">Panier vide</p>
                  <p class="text-xs font-sans">Découvrez nos produits et faites votre choix.</p>
               </div>
            }
         </div>

         <div class="p-6 border-t border-surface-2 bg-white flex flex-col gap-4">
            <div class="flex items-center justify-between px-1">
               <span class="text-xs font-bold text-muted uppercase tracking-widest font-sans">Sous-total</span>
               <span class="text-xl font-mono text-dark">{{cartSubtotal()}} FCFA</span>
            </div>
            <button (click)="checkout()" [disabled]="!cartItemsCount()" class="btn-primary w-full !py-4 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale uppercase text-xs font-bold tracking-widest transition-all">
               Finaliser Commande
            </button>
         </div>
      </div>

      <!-- Wishlist Panel -->
      <div class="oc-panel shadow-oc-lg" [class.oc-panel-hidden]="activePanel() !== 'wishlist'">
         <div class="p-6 border-b border-surface-2 flex items-center justify-between">
            <h3 class="text-xl font-display font-medium text-dark">Vos Favoris <span class="text-primary text-sm font-sans font-bold ml-2">({{wishlistItemsCount()}})</span></h3>
            <button (click)="closeAllPanels()" class="icon-btn" aria-label="Fermer"><mat-icon>close</mat-icon></button>
         </div>

         <div class="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            @for (item of products(); track item['id']) {
               @if (isInWishlist(asString(item['id']))) {
                 <div class="flex gap-4 group">
                    <div class="w-20 h-24 bg-white rounded-xl overflow-hidden shrink-0 border border-surface-2">
                       <img [src]="item['imageUrl'] || 'https://picsum.photos/seed/'+item['id']+'/400'" [alt]="asString(item['name'])" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col">
                       <h4 class="text-sm font-medium text-dark leading-tight line-clamp-2 mb-1">{{item['name']}}</h4>
                       <p class="text-xs font-mono text-primary mb-4">{{item['price']}} FCFA</p>
                       <div class="flex gap-2 mt-auto">
                          <button (click)="addToCart($event, item)" class="flex-1 h-8 bg-dark text-white-soft rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95">Ajouter</button>
                          <button (click)="toggleWishlist($event, item)" class="w-8 h-8 rounded-lg border border-surface-2 text-red-400 hover:bg-red-50 flex items-center justify-center transition-all" aria-label="Supprimer"><mat-icon class="scale-75">delete</mat-icon></button>
                       </div>
                    </div>
                 </div>
               }
            } @empty {
               <div class="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <mat-icon class="scale-[3] mb-6">favorite_border</mat-icon>
                  <p class="text-lg font-display font-medium mb-1">Aucun coup de cœur</p>
                  <p class="text-xs font-sans">Enregistrez vos produits préférés ici.</p>
               </div>
            }
         </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0px); }
    .animate-fade-in {
      animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    @keyframes fadeUpShort {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-up-short {
      animation: fadeUpShort 0.2s cubic-bezier(0, 0, 0.2, 1);
    }
    .sidebar.collapsed {
      width: 80px;
    }
    .sidebar.collapsed .sidebar-item span,
    .sidebar.collapsed .sidebar-sub-item,
    .sidebar.collapsed .text-xs,
    .sidebar.collapsed .Promo-Help-Card {
      display: none;
    }
    .sidebar.collapsed .sidebar-item {
       justify-content: center;
       padding-left: 0;
       padding-right: 0;
    }
    .sidebar.collapsed .sidebar-item mat-icon:last-child {
       display: none;
    }
  `]
})
export class StorefrontComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private dataService = inject(DataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  
  products = computed(() => this.dataService.products$() as Record<string, unknown>[]);
  notifications = this.dataService.notifications$;
  selectedCategory = signal<string>('all');
  selectedSort = signal<string>('default');
  mobileMenuOpen = signal(false);
  userMenuOpen = signal(false);
  notificationMenuOpen = signal(false);
  activePanel = signal<PanelType>('none');
  searchQueryInput = '';
  showReturnsPolicy = signal(false);
  sidebarCollapsed = signal(false);
  openGroups = signal<Record<string, boolean>>({ 'group-froid': true });
  
  // Advanced Filters
  searchQuery = signal('');
  priceRange = signal<{min: number, max: number}>({min: 0, max: 2000000});
  onlyInStock = signal(false);
  minRating = signal(0);
  filtersExpanded = signal(false);

  private unsub?: Unsubscribe;
  private unsubNotif?: Unsubscribe;
  private unsubStock?: Unsubscribe;

  constructor() {
    effect(() => {
      const user = this.authService.user$();
      const profile = this.authService.profile$();
      if (user && profile) {
        if (this.unsubNotif) this.unsubNotif();
        if (this.unsubStock) this.unsubStock();
        
        this.unsubNotif = this.dataService.watchNotifications(user.uid);
        
        const role = profile['role'];
        
        // Auto-redirect administrative roles to their dashboards if they land here
        if (role === 'admin' || role === 'manager_erp') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'fournisseur' || role === 'manager_sup' || role === 'supplier') {
          this.router.navigate(['/supplier/dashboard']);
        }

        if (role === 'admin' || role === 'fournisseur' || role === 'manager_erp' || role === 'manager_sup') {
          this.dataService.monitorStockLevels();
        }
      } else {
        if (this.unsubNotif) this.unsubNotif();
        if (this.unsubStock) this.unsubStock();
      }
    });
  }

  // Computed Values
  cartItems = this.cartService.items$;
  cartItemsCount = this.cartService.totalItems;
  cartSubtotal = this.cartService.subtotal;
  wishlistItemsCount = this.wishlistService.count;
  unreadNotifsCount = computed(() => this.notifications().filter(n => !n['read']).length);

  categories = [
    { 
      id: 'group-froid', 
      name: 'Froid & Conservation', 
      icon: 'kitchen',
      items: [
        { id: 'frigo', name: 'Réfrigérateurs' },
        { id: 'congel', name: 'Congélateurs' },
        { id: 'cave', name: 'Caves à vin' },
        { id: 'mini', name: 'Mini-frigos' }
      ]
    },
    { 
      id: 'group-ecran', 
      name: 'Image & Son', 
      icon: 'tv',
      items: [
        { id: 'tv', name: 'Téléviseurs' },
        { id: 'home', name: 'Home Cinéma' },
        { id: 'barre', name: 'Barres de son' }
      ]
    },
    { 
      id: 'group-clim', 
      name: 'Climatisation', 
      icon: 'ac_unit',
      items: [
        { id: 'clim', name: 'Climatiseurs Split' },
        { id: 'mobile', name: 'Climatiseurs mobiles' },
        { id: 'ventilo', name: 'Ventilateurs' }
      ]
    },
    { 
      id: 'group-linge', 
      name: 'Linge & Vaisselle', 
      icon: 'local_laundry_service',
      items: [
        { id: 'laver', name: 'Lave-linge' },
        { id: 'secher', name: 'Sèche-linge' },
        { id: 'vaisselle', name: 'Lave-vaisselle' }
      ]
    },
    { 
      id: 'group-cuisine', 
      name: 'Cuisine & Cuisson', 
      icon: 'microwave',
      items: [
        { id: 'cuisine', name: 'Cuisinières' },
        { id: 'four', name: 'Fours encastrables' },
        { id: 'micro', name: 'Micro-ondes' }
      ]
    },
    { 
      id: 'group-petit', 
      name: 'Petit Électroménager', 
      icon: 'blender',
      items: [
        { id: 'cafe', name: 'Cafetières' },
        { id: 'mixeur', name: 'Mixeurs & Blenders' },
        { id: 'fer', name: 'Fer à repasser' }
      ]
    }
  ];

  features = [
    { title: 'Livraison rapide', sub: '48h à Abidjan', icon: 'local_shipping' },
    { title: 'Garantie 2 ans', sub: 'SAV certifié constructeur', icon: 'verified_user' },
    { title: 'Paiement échelonné', sub: 'Jusqu\'à 12 mois sans frais', icon: 'payments' },
    { title: 'Support 7j/7', sub: 'Équipe disponible 8h–20h', icon: 'headset_mic' }
  ];

  featuredProducts = computed(() => {
    const all = this.products();
    if (!all || all.length === 0) return [];
    
    // Pick products marked as featured, promo, or packs
    const featured = all.filter(p => 
      (p['isFeatured'] === true) || 
      (p['isPromo'] === true) || 
      (p['category'] === 'pack')
    );
    
    if (featured.length > 0) return featured.slice(0, 3);
    
    // Fallback: Pick 3 products based on variety (different categories) if possible
    return [...all].sort(() => 0.5 - Math.random()).slice(0, 3);
  });

  filteredProducts = computed(() => {
    let prods = this.products();
    const cat = this.selectedCategory();
    const queryStr = this.searchQuery().toLowerCase();
    const price = this.priceRange();
    const inStock = this.onlyInStock();

    // Search 
    if (queryStr) {
      prods = prods.filter(p => 
        (p['name'] as string).toLowerCase().includes(queryStr) || 
        (p['description'] as string || '').toLowerCase().includes(queryStr)
      );
    }

    // Category
    if (cat !== 'all') {
      prods = prods.filter(p => p['category'] === cat);
    }

    // Price
    prods = prods.filter(p => (p['price'] as number) >= price.min && (p['price'] as number) <= price.max);

    // Stock
    if (inStock) {
      prods = prods.filter(p => (p['stock'] as number) > 0);
    }

    return prods;
  });

  sortedProducts = computed(() => {
    const prods = [...this.filteredProducts()];
    const sort = this.selectedSort();
    if (sort === 'cheap') return prods.sort((a, b) => (a['price'] as number) - (b['price'] as number));
    if (sort === 'expensive') return prods.sort((a, b) => (b['price'] as number) - (a['price'] as number));
    return prods;
  });

  toggleGroup(id: string) {
    this.openGroups.update(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  asString(val: unknown): string { return (val as string) || ''; }

  checkout() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const items = this.cartItems();
    if (items.length === 0) return;

    const user = this.authService.user$();
    const profile = this.authService.profile$() as Record<string, unknown>;

    if (!confirm('Voulez-vous confirmer votre commande sur O’CHAP ?')) return;

    const orderData = {
      customerName: (profile?.['displayName'] as string) || user?.email || 'Client',
      customerUid: user?.uid || '',
      deliveryAddress: (profile?.['address'] as string) || 'Adresse enregistrée',
      deliveryZone: (profile?.['city'] as string) || 'Abidjan',
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.imageUrl,
        category: i.category
      })),
      totalAmount: this.cartSubtotal()
    };

    this.dataService.placeOrder(orderData).then(success => {
      if (success) {
        this.cartService.clearCart();
        this.closeAllPanels();
        alert('Votre commande a été enregistrée avec succès ! Retrouvez-la dans "Mes Commandes".');
        this.router.navigate(['/orders']);
      } else {
        alert('Une erreur est survenue lors de la commande. Veuillez vérifier vos stocks.');
      }
    });
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.userMenuOpen.update(v => !v);
    this.notificationMenuOpen.set(false);
  }

  toggleNotificationMenu(event: Event) {
    event.stopPropagation();
    this.notificationMenuOpen.update(v => !v);
    this.userMenuOpen.set(false);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  async handleLogout() {
    this.userMenuOpen.set(false);
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.userMenuOpen.set(false);
    this.notificationMenuOpen.set(false);
  }

  ngOnInit() {
    this.watchProducts();
    
    // Set initial category from route data if present
    const routeData = this.route.snapshot.data;
    if (routeData && routeData['category']) {
      this.selectedCategory.set(routeData['category']);
    }
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
    if (this.unsubNotif) this.unsubNotif();
    if (this.unsubStock) this.unsubStock();
  }

  watchProducts() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.unsub = this.dataService.watchAllProducts();
  }

  markAsRead(id: string) {
    this.dataService.markNotificationRead(id);
  }

  getNotifIcon(type: string): string {
    switch(type) {
      case 'low_stock': return 'inventory';
      case 'order_confirmed': return 'shopping_bag';
      default: return 'notifications';
    }
  }

  selectCategory(id: string) {
    this.selectedCategory.set(id);
    this.mobileMenuOpen.set(false);
    this.activePanel.set('none');
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  updatePrice(min: number, max: number) {
    this.priceRange.set({ min, max });
  }

  openPanel(type: PanelType) {
    const protectedPanels: PanelType[] = ['cart', 'wishlist', 'orders', 'profile'];
    if (protectedPanels.includes(type) && !this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    
    // If it's a mobile link that should go to a page
    if (type === 'profile') {
      this.router.navigate(['/profile']);
      return;
    }
    if (type === 'orders') {
      this.router.navigate(['/orders']);
      return;
    }

    this.activePanel.set(type);
    this.mobileMenuOpen.set(false);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeAllPanels() {
    this.activePanel.set('none');
    this.mobileMenuOpen.set(false);
    this.userMenuOpen.set(false);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  addToCart(event: Event, product: Record<string, unknown>) {
    event.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.cartService.addToCart(product);
    this.openPanel('cart');
  }

  updateQty(id: string, delta: number) {
    this.cartService.updateQuantity(id, delta);
  }

  removeFromCart(id: string) {
    this.cartService.removeFromCart(id);
  }

  toggleWishlist(event: Event, product: Record<string, unknown>) {
    event.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.wishlistService.toggleWishlist(product['id'] as string);
  }

  isInWishlist(id: string) {
    return this.wishlistService.isInWishlist(id);
  }
}
