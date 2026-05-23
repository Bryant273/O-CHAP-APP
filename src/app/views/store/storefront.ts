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
                    <span class="w-full h-full flex items-center justify-center bg-dark text-white-soft text-[10px] font-bold">
                      {{authService.user$()?.displayName?.charAt(0)}}
                    </span>
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
          
          <div class="max-w-7xl mx-auto px-6 py-8">
            
            <!-- Header removed as requested -->

            <!-- Minimalist Hero Banner -->
            @if (heroProduct(); as prod) {
              <div [routerLink]="['/products', prod['id']]" 
                   class="mb-16 relative overflow-hidden rounded-[3rem] bg-[#0D1B2A] h-[400px] lg:h-[500px] group cursor-pointer shadow-2xl shadow-navy/20 border border-white/5 animate-fade-in group">
                
                <img [src]="asString(prod['imageUrl'])" 
                     class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-[8000ms] ease-out opacity-60" 
                     referrerpolicy="no-referrer"
                     [alt]="asString(prod['name'])">
                
                <div class="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-navy via-navy/40 to-transparent flex flex-col justify-center p-10 lg:p-20">
                  <div class="max-w-2xl">
                    <div class="inline-flex items-center gap-3 px-4 py-1.5 bg-primary rounded-full mb-8 shadow-lg shadow-primary/20">
                       <mat-icon class="scale-50 text-white">star</mat-icon>
                       <span class="text-white text-[9px] font-black uppercase tracking-[0.3em]">
                         MAÎTRE DU FROID — ÉDITION LIMITÉE
                       </span>
                    </div>
                    
                    <h2 class="text-4xl lg:text-7xl font-display font-black text-white mb-8 tracking-tighter italic leading-[0.95]">
                      {{ prod['name'] }}
                    </h2>
  
                    <div class="flex items-center gap-10">
                       <div class="flex flex-col">
                          <span class="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">Offre de Lancement</span>
                          <span class="text-primary text-5xl font-black font-price tracking-tighter">{{ formatPrice(prod['price']) }} <span class="text-[12px] opacity-40 uppercase font-sans">FCFA</span></span>
                       </div>
                       
                       <div class="h-20 w-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white group-hover:bg-primary group-hover:scale-110 transition-all duration-700 shadow-2xl">
                          <mat-icon class="scale-125">arrow_forward</mat-icon>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- ENCART D'AVIS ET NOTATION S'IL Y A UN PRODUIT À NOTER -->
            @if (latestDeliveredOrder() && firstItemToReview()) {
               <div class="mb-12 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-12 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between font-sans">
                  <div class="flex items-start gap-6 max-w-xl">
                     <div class="w-16 h-16 rounded-2xl bg-white border border-emerald-500/20 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                        @if (firstItemToReview()?.['imageUrl']) {
                           <img [src]="asString(firstItemToReview()?.['imageUrl'])" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                        } @else {
                           <mat-icon class="text-emerald-500 text-3xl">star</mat-icon>
                        }
                     </div>
                     <div class="space-y-2">
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-700 rounded-full">
                           <mat-icon class="scale-50">check_circle</mat-icon>
                           <span class="text-[9px] font-black uppercase tracking-wider">Commande Reçue & Livrée !</span>
                        </div>
                        <h4 class="text-base font-bold text-navy">Votre avis compte : {{ firstItemToReview()?.['name'] || 'Produit' }}</h4>
                        <p class="text-xs text-[#5a5e72] leading-relaxed font-medium">Félicitations pour votre achat ! Prenez quelques secondes pour noter la qualité de votre produit afin d'éclairer la communauté et valider définitivement la commande.</p>
                     </div>
                  </div>
                  
                  <div class="w-full md:w-auto flex flex-col gap-4 bg-white p-6 rounded-3xl border border-[#e4e6ea] shadow-sm max-w-sm shrink-0">
                     <div class="text-center font-bold text-[10px] text-muted uppercase tracking-widest mb-1">Attribuer une note</div>
                     
                     <div class="flex items-center justify-center gap-2">
                        @for (star of [1, 2, 3, 4, 5]; track star) {
                           <button (click)="storefrontRating.set(star)" class="text-amber-400 hover:scale-125 transition-transform focus:outline-none">
                              <mat-icon class="scale-125 select-none">{{ storefrontRating() >= star ? 'star' : 'star_border' }}</mat-icon>
                           </button>
                        }
                     </div>
                     
                     <div class="relative mt-2">
                        <textarea [ngModel]="storefrontComment()" (ngModelChange)="storefrontComment.set($event)" placeholder="Ex: Excellent produit, conforme à mes attentes..." class="w-full h-20 bg-[#fafafa] border border-[#e4e6ea] rounded-2xl p-4 text-xs font-medium placeholder-muted/50 focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none"></textarea>
                     </div>
                     
                     <button (click)="submitStorefrontReview()" [disabled]="!storefrontRating() || !storefrontComment().trim() || submittingStorefrontReview()" class="w-full h-12 bg-[#FF6200] hover:bg-black text-white disabled:bg-gray-200 disabled:text-gray-400 font-sans text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2">
                        @if (submittingStorefrontReview()) {
                           <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Publiant...
                        } @else {
                           <mat-icon class="scale-75">send</mat-icon> Publier mon avis
                        }
                     </button>
                  </div>
               </div>
            }

            <!-- MODAL FLOTTANT D'AVIS ET RATING S'IL Y A UN PRODUIT À NOTER -->
            @if (latestDeliveredOrder() && firstItemToReview() && showReviewModal()) {
               <div class="fixed inset-0 z-[100] flex items-end justify-center md:items-center bg-navy/30 backdrop-blur-sm p-4 animate-fade-in font-sans">
                  <div class="relative bg-white w-full max-w-lg rounded-[2.5rem] border border-[#e4e6ea] shadow-2xl p-8 md:p-10 flex flex-col gap-6 overflow-hidden">
                     
                     <button (click)="showReviewModal.set(false)" class="absolute right-6 top-6 w-8 h-8 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6ea] transition-all flex items-center justify-center text-navy shadow-sm border border-black/5" title="Fermer">
                        <mat-icon class="scale-75">close</mat-icon>
                     </button>
                     
                     <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                           <mat-icon class="scale-90">rate_review</mat-icon>
                        </div>
                        <div>
                           <div class="text-[9px] font-black uppercase tracking-wider text-emerald-600">Partage d'Expérience</div>
                           <h3 class="text-lg font-black text-navy leading-none mt-1">Évaluez votre dernier achat</h3>
                        </div>
                     </div>
                     
                     <p class="text-xs text-[#5a5e72] font-medium leading-relaxed">
                        Vous avez récemment reçu <span class="font-bold text-navy">"{{ firstItemToReview()?.['name'] || 'votre produit' }}"</span> de notre boutique. Prenez un court instant pour noter cet achat directement depuis l'application. Vos retours guident d'autres clients.
                     </p>
                     
                     <div class="flex items-center gap-4 py-4 bg-[#fafafa] px-6 rounded-3xl border border-[#e4e6ea]">
                        <div class="w-14 h-14 rounded-2xl bg-white border border-[#e4e6ea] overflow-hidden flex-shrink-0 flex items-center justify-center">
                           @if (firstItemToReview()?.['imageUrl']) {
                              <img [src]="asString(firstItemToReview()?.['imageUrl'])" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                           } @else {
                              <mat-icon class="text-amber-500">star</mat-icon>
                           }
                        </div>
                        <div class="flex-1 min-w-0">
                           <h4 class="text-xs font-black text-navy uppercase truncate tracking-tight">{{ firstItemToReview()?.['name'] }}</h4>
                           <p class="text-[10px] font-semibold text-muted tracking-tight mt-1">Commandé le {{ (latestDeliveredOrder()?.['createdAt'] | date:'dd/MM/yyyy') || 'récemment' }}</p>
                        </div>
                     </div>
                     
                     <div class="space-y-4">
                        <div class="flex items-center justify-center gap-3">
                           @for (star of [1, 2, 3, 4, 5]; track star) {
                              <button (click)="storefrontRating.set(star)" class="text-amber-400 hover:scale-125 transition-transform focus:outline-none">
                                 <mat-icon class="scale-[1.5] select-none">{{ storefrontRating() >= star ? 'star' : 'star_border' }}</mat-icon>
                              </button>
                           }
                        </div>
                        
                        <textarea [ngModel]="storefrontComment()" (ngModelChange)="storefrontComment.set($event)" placeholder="Racontez votre expérience... (conforme à vos attentes ? qualité globale ? efficacité ?)" class="w-full h-24 bg-[#fafafa] border border-[#e4e6ea] rounded-3xl p-5 text-xs font-medium placeholder-muted/50 focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none"></textarea>
                     </div>
                     
                     <div class="flex gap-4">
                        <button (click)="showReviewModal.set(false)" class="flex-1 h-12 border border-[#e4e6ea] hover:bg-[#fafafa] text-navy font-sans text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all font-sans">
                           Plus tard
                        </button>
                        <button (click)="submitStorefrontReview()" [disabled]="!storefrontRating() || !storefrontComment().trim() || submittingStorefrontReview()" class="flex-1 h-12 bg-[#FF6200] hover:bg-black text-white disabled:bg-gray-200 disabled:text-[#FF6200] font-sans text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2">
                           @if (submittingStorefrontReview()) {
                              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Publiant...
                           } @else {
                              <mat-icon class="scale-75">send</mat-icon> Publier
                           }
                        </button>
                     </div>
                  </div>
               </div>
            }

            <!-- Filters Bar (Faceted Filter Trigger) -->
            <div class="flex flex-col gap-8 mb-12">
               <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#f0f2f5]">
                  <div>
                    <h2 class="text-3xl font-display font-black text-navy tracking-tight leading-none mb-2">La Collection <span class="text-primary italic">Signature.</span></h2>
                    <p class="text-[10px] font-bold text-muted uppercase tracking-[0.3em] opacity-60">SÉLECTION QUALITÉ CONTRÔLÉE — O'CHAP AFRICA 2026</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-4">
                     <!-- Sort Control -->
                     <div class="relative group">
                       <select [ngModel]="selectedSort()" (ngModelChange)="selectedSort.set($event)" class="bg-white border border-[#e4e6ea] rounded-2xl px-8 h-12 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer focus:border-primary transition-all appearance-none pr-12 shadow-sm group-hover:shadow-md">
                          <option value="default">Ordre: Intelligence</option>
                          <option value="cheap">Prix: Les plus accessibles</option>
                          <option value="expensive">Prix: Excellence & Luxe</option>
                       </select>
                       <mat-icon class="absolute right-4 top-1/2 -translate-y-1/2 text-muted scale-75 pointer-events-none group-focus-within:rotate-180 transition-transform">expand_more</mat-icon>
                     </div>

                     <!-- Filters Toggle -->
                     <button (click)="filtersExpanded.set(!filtersExpanded())" 
                             [class.bg-dark]="filtersExpanded()"
                             [class.text-white]="filtersExpanded()"
                             class="flex items-center gap-4 px-8 h-12 rounded-2xl border border-[#e4e6ea] hover:border-primary transition-all group shadow-sm active:scale-95">
                        <mat-icon class="scale-75 transition-transform" [class.rotate-180]="filtersExpanded()">tune</mat-icon>
                        <span class="text-[10px] font-black uppercase tracking-widest">{{filtersExpanded() ? 'Fermer les filtres' : 'Affiner la recherche'}}</span>
                     </button>
                  </div>
               </div>
  
               <!-- ADVANCED FACETED FILTERS PANEL -->
               <div class="bg-white border border-[#e4e6ea] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-navy/5 transition-all duration-700 ease-out"
                    [class.max-h-0]="!filtersExpanded()"
                    [class.opacity-0]="!filtersExpanded()"
                    [class.p-0]="!filtersExpanded()"
                    [class.p-12]="filtersExpanded()"
                    [class.mb-8]="filtersExpanded()">
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                     <!-- Price Range Facet -->
                     <div class="space-y-6">
                        <div class="flex items-center gap-3">
                           <mat-icon class="text-primary scale-75">payments</mat-icon>
                           <h4 class="text-[11px] font-black uppercase text-navy tracking-[0.2em]">Gamme de Prix</h4>
                        </div>
                        <div class="space-y-4">
                           <div class="grid grid-cols-2 gap-4">
                              <div class="space-y-1">
                                 <label class="text-[9px] font-black text-muted uppercase tracking-tighter ml-1">Minimum</label>
                                 <input type="number" [(ngModel)]="priceRange().min" (input)="updatePrice(priceRange().min, priceRange().max)" class="w-full bg-[#f8f9fa] border border-[#e4e6ea] rounded-xl h-11 px-4 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all">
                              </div>
                              <div class="space-y-1">
                                 <label class="text-[9px] font-black text-muted uppercase tracking-tighter ml-1">Maximum</label>
                                 <input type="number" [(ngModel)]="priceRange().max" (input)="updatePrice(priceRange().min, priceRange().max)" class="w-full bg-[#f8f9fa] border border-[#e4e6ea] rounded-xl h-11 px-4 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all">
                              </div>
                           </div>
                           <input type="range" [min]="0" [max]="2000000" [step]="50000" [(ngModel)]="priceRange().max" (input)="updatePrice(priceRange().min, priceRange().max)" class="w-full accent-primary">
                        </div>
                     </div>
  
                     <!-- Brand Facet -->
                     <div class="space-y-6">
                        <div class="flex items-center gap-3">
                           <mat-icon class="text-primary scale-75">verified</mat-icon>
                           <h4 class="text-[11px] font-black uppercase text-navy tracking-[0.2em]">Marques</h4>
                        </div>
                        <div class="flex flex-wrap gap-2">
                           @for (brand of availableBrands(); track brand) {
                              <button (click)="toggleBrand(brand)"
                                      [class.bg-primary]="selectedBrands().includes(brand)"
                                      [class.text-white]="selectedBrands().includes(brand)"
                                      [class.border-primary]="selectedBrands().includes(brand)"
                                      class="px-4 py-2 rounded-xl border border-[#e4e6ea] text-[9px] font-black uppercase tracking-widest hover:border-primary transition-all">
                                 {{ brand }}
                              </button>
                           }
                        </div>
                     </div>

                     <!-- Rating Facet -->
                     <div class="space-y-6">
                        <div class="flex items-center gap-3">
                           <mat-icon class="text-primary scale-75">star_outline</mat-icon>
                           <h4 class="text-[11px] font-black uppercase text-navy tracking-[0.2em]">Note Clientel</h4>
                        </div>
                        <div class="flex flex-col gap-2">
                           @for (star of [5, 4, 3, 2]; track star) {
                              <button (click)="selectedRating.set(star === selectedRating() ? 0 : star)"
                                      class="flex items-center gap-3 h-10 px-4 rounded-xl transition-all group hover:bg-gray-50"
                                      [class.bg-primary/10]="selectedRating() === star">
                                 <div class="flex gap-0.5 text-primary">
                                    @for (i of [1,2,3,4,5]; track i) {
                                       <mat-icon class="scale-50">{{ i <= star ? 'star' : 'star_border' }}</mat-icon>
                                    }
                                 </div>
                                 <span class="text-[9px] font-black uppercase tracking-widest" [class.text-primary]="selectedRating() === star">{{ star }}+ Étoiles</span>
                              </button>
                           }
                        </div>
                     </div>

                     <!-- Stock Facet -->
                     <div class="space-y-6 lg:border-l lg:border-[#f0f2f5] lg:pl-12">
                        <h4 class="text-[11px] font-black uppercase text-navy tracking-[0.2em]">Disponibilité Stock</h4>
                        <label class="flex items-center gap-4 cursor-pointer group">
                           <div class="w-12 h-7 rounded-full relative transition-all duration-300 shadow-inner" 
                                [class.bg-emerald-500]="onlyInStock()"
                                [class.bg-slate-200]="!onlyInStock()">
                              <input type="checkbox" [(ngModel)]="onlyInStock" class="hidden">
                              <div class="absolute w-5 h-5 bg-white rounded-full top-1 left-1 transition-all duration-300 shadow-md" [style.transform]="onlyInStock() ? 'translateX(20px)' : ''"></div>
                           </div>
                           <span class="text-[11px] font-black uppercase tracking-widest transition-colors font-sans"
                                 [class.text-emerald-700]="onlyInStock()"
                                 [class.text-muted]="!onlyInStock()">
                             {{ onlyInStock() ? 'Prêt pour expédition' : 'Total Catalogue' }}
                           </span>
                        </label>
                        <div class="pt-4 mt-4 border-t border-[#f0f2f5]">
                           <button (click)="resetFilters()" class="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity">
                              <mat-icon class="scale-50">refresh</mat-icon> Réinitialiser tout
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
  
            <!-- PROFESSIONAL PRODUCT GRID -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              @for (p of sortedProducts(); track p['id']) {
                <div class="product-card group animate-fade-in" [routerLink]="['/products', p['id']]">
                  <!-- Image Container: Professional Inset -->
                  <div class="aspect-square relative bg-[#fafbfc] rounded-[2.5rem] overflow-hidden flex items-center justify-center p-10 border border-[#f0f2f5] shadow-sm group-hover:border-primary/20 transition-all duration-500">
                    <img [src]="p['imageUrl']" 
                         [alt]="asString(p['name'])"
                         class="max-w-full max-h-full object-contain transition-transform duration-1000 group-hover:scale-110 drop-shadow-2xl" 
                         referrerpolicy="no-referrer">
                    
                    @if (p['isPromo']) {
                      <div class="absolute top-6 left-6 bg-primary text-white text-[8px] font-black px-4 py-2 rounded-xl uppercase shadow-xl shadow-primary/20 z-10 tracking-[0.2em]">OFFRE SPÉCIALE</div>
                    }

                    @if (p['stock'] === 0) {
                      <div class="absolute inset-0 bg-[#0D1B2A]/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all">
                        <span class="px-6 py-2 border-2 border-white/40 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl">Rupture Fatale</span>
                      </div>
                    }

                    <!-- Quick Interaction Layer -->
                    <div class="absolute inset-0 bg-navy/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div class="absolute bottom-6 left-6 right-6 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 flex gap-3 z-20">
                      <button (click)="toggleWishlist($event, p)" 
                              [class.bg-red-500]="isInWishlist(asString(p['id']))"
                              [class.text-white]="isInWishlist(asString(p['id']))"
                              [class.text-red-500]="!isInWishlist(asString(p['id']))"
                              class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all">
                        <mat-icon class="scale-90">{{ isInWishlist(asString(p['id'])) ? 'favorite' : 'favorite_border' }}</mat-icon>
                      </button>
                      <button (click)="addToCart($event, p)" [disabled]="p['stock'] === 0" class="flex-1 h-12 rounded-2xl bg-[#0D1B2A] text-white flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl active:scale-95 disabled:opacity-50">
                        <mat-icon class="scale-75">add_shopping_cart</mat-icon>
                        Acheter
                      </button>
                    </div>
                  </div>

                  <!-- Details Container: Optimized Density -->
                  <div class="mt-8 px-2 flex flex-col items-center text-center">
                     <div class="flex items-center gap-2 mb-2">
                        <span class="text-[9px] font-black text-primary uppercase tracking-[0.2em] px-2 py-0.5 bg-primary/5 rounded">{{p['brand'] || "O'CHAP"}}</span>
                        <div class="flex gap-0.5 transform scale-[0.6]">
                           @for (i of [1,2,3,4,5]; track i) {
                              <mat-icon class="text-amber-400">star</mat-icon>
                           }
                        </div>
                     </div>
                     <h3 class="text-[15px] font-black text-[#0D1B2A] leading-tight mb-3 group-hover:text-primary transition-colors tracking-tight line-clamp-1 w-full px-4">{{p['name']}}</h3>
                     <div class="flex items-center justify-center gap-3">
                        <span class="text-xl font-price font-black text-[#0D1B2A] tracking-tighter">{{ formatPrice(p['price']) }} <span class="text-[10px] opacity-40 uppercase font-sans tracking-normal ml-1">CFA</span></span>
                     </div>
                  </div>
                </div>
              } @empty {
                <div class="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-30">
                   <div class="w-24 h-24 rounded-[3rem] bg-gray-50 flex items-center justify-center mb-8"><mat-icon class="scale-[2.5]">inventory_2</mat-icon></div>
                   <h3 class="font-display font-black text-2xl uppercase tracking-[0.3em]">Aucun matching trouvé.</h3>
                   <p class="text-xs font-bold text-muted uppercase tracking-widest mt-2">Essayez de reset les filtres ou changez votre recherche.</p>
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

      <!-- Scroll to Top (Hidden by default, shown via scroll listener) -->
      @if (showScrollTop()) {
        <button (click)="scrollToTop()" 
                class="fixed bottom-[140px] right-6 z-50 w-12 h-12 bg-white rounded-2xl shadow-2xl border border-surface-2 flex items-center justify-center text-ink hover:bg-primary hover:text-white transition-all animate-fade-in active:scale-95">
          <mat-icon>arrow_upward</mat-icon>
        </button>
      }

      <!-- Quick Cart Peek (Floating Toast on add) -->
      @if (showAddedToast()) {
        <div class="fixed top-24 right-6 z-[3000] bg-navy text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-4">
           <mat-icon class="text-primary">check_circle</mat-icon>
           <div>
              <p class="text-[10px] font-black uppercase tracking-widest">Produit ajouté !</p>
              <p class="text-[9px] opacity-60">Consultez votre panier pour finaliser.</p>
           </div>
        </div>
      }

      <!-- Mobile Category Navigation (Floating Bottom) -->
      <div class="lg:hidden fixed bottom-[72px] left-0 right-0 z-40 px-4 animate-fade-up pointer-events-none" style="animation-delay: 0.5s">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 pointer-events-auto">
           <button (click)="selectCategory('all')" 
                   class="cat-chip-float" 
                   [class.cat-chip-float-active]="selectedCategory() === 'all'">
             Tous
           </button>
           @for (group of categories; track group.id) {
              @for (item of group.items; track item.id) {
                 <button (click)="selectCategory(item.id)" 
                         class="cat-chip-float" 
                         [class.cat-chip-float-active]="selectedCategory() === item.id">
                    {{item.name}}
                 </button>
              }
           }
        </div>
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
                     <p class="text-xs font-price text-primary mb-3">{{ formatPrice(item.price) }} FCFA</p>
                     
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
               <span class="text-xl font-price text-dark">{{ formatPrice(cartSubtotal()) }} FCFA</span>
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
                       <p class="text-xs font-price text-primary mb-4">{{ formatPrice(item['price']) }} FCFA</p>
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
    .cat-chip-float {
      background-color: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid #e2e8f0;
      padding: 0.5rem 1.25rem;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      white-space: nowrap;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }
    .cat-chip-float:hover {
      border-color: #f97316;
      color: #f97316;
      transform: translateY(-1px);
    }
    .cat-chip-float-active {
      background-color: #f97316;
      color: white;
      border-color: #f97316;
      box-shadow: 0 20px 25px -5px rgba(249, 115, 22, 0.3);
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
  showScrollTop = signal(false);
  showAddedToast = signal(false);
  openGroups = signal<Record<string, boolean>>({ 'group-froid': true });
  
  // Advanced Filters
  searchQuery = signal('');
  priceRange = signal<{min: number, max: number}>({min: 0, max: 2000000});
  onlyInStock = signal(false);
  minRating = signal(0);

  // Product Review prompt states
  showReviewModal = signal(true);
  storefrontRating = signal(0);
  storefrontComment = signal('');
  submittingStorefrontReview = signal(false);

  latestDeliveredOrder = computed(() => {
    const list = this.dataService.orders$() as Record<string, unknown>[];
    if (!list || list.length === 0) return null;
    
    // Filter completed or delivered orders that have not been reviewed yet
    const unreviewed = list
      .filter(o => (o['status'] === 'delivered' || o['status'] === 'completed') && !o['reviewed'])
      .sort((a, b) => {
        const t1 = (a['createdAt'] as { seconds?: number })?.seconds || 0;
        const t2 = (b['createdAt'] as { seconds?: number })?.seconds || 0;
        return t2 - t1;
      });
      
    return unreviewed[0] || null;
  });

  firstItemToReview = computed(() => {
    const order = this.latestDeliveredOrder();
    if (!order) return null;
    const items = (order['items'] as Record<string, unknown>[]) || [];
    return items[0] || null;
  });
  filtersExpanded = signal(false);
  selectedBrands = signal<string[]>([]);
  selectedRating = signal<number>(0);

  availableBrands = computed(() => {
    const prods = this.products();
    const brandsSet = new Set<string>();
    prods.forEach(p => {
      const brand = (p['brand'] as string);
      if (brand) brandsSet.add(brand);
    });
    return Array.from(brandsSet).sort();
  });

  private unsub?: Unsubscribe;
  private unsubNotif?: Unsubscribe;
  private unsubStock?: Unsubscribe;
  private unsubOrders?: Unsubscribe;

  constructor() {
    effect(() => {
      const user = this.authService.user$();
      const profile = this.authService.profile$();
      if (user && profile) {
        if (this.unsubNotif) this.unsubNotif();
        if (this.unsubStock) this.unsubStock();
        if (this.unsubOrders) this.unsubOrders();
        
        this.unsubNotif = this.dataService.watchNotifications(user.uid);
        
        const role = profile['role'];
        if (role !== 'admin' && role !== 'manager_erp' && role !== 'fournisseur' && role !== 'manager_sup' && role !== 'supplier') {
          this.unsubOrders = this.dataService.watchUserOrders(user.uid);
        }
        
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
        if (this.unsubNotif) {
          this.unsubNotif();
          this.unsubNotif = undefined;
        }
        if (this.unsubStock) {
          this.unsubStock();
          this.unsubStock = undefined;
        }
        if (this.unsubOrders) {
          this.unsubOrders();
          this.unsubOrders = undefined;
        }
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
    { title: 'Paiement échelonné', sub: "Jusqu'à 12 mois sans frais", icon: 'payments' },
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

  heroProduct = computed(() => {
    const all = this.products();
    if (!all || all.length === 0) return null;
    
    // Logic: Look for a hero product (quality/price balance)
    // We prioritize products with "Premium" in name OR high price but marked as promo
    const candidates = all.filter(p => 
      this.asString(p['name']).toLowerCase().includes('premium') || 
      (this.asNumber(p['price']) > 500000 && p['isPromo'])
    );
    
    return candidates.length > 0 ? candidates[0] : all[0];
  });

  filteredProducts = computed(() => {
    let prods = this.products();
    const cat = this.selectedCategory();
    const queryStr = this.searchQuery().toLowerCase();
    const price = this.priceRange();
    const inStock = this.onlyInStock();
    const brands = this.selectedBrands();
    const ratingLimit = this.selectedRating();

    // Search 
    if (queryStr) {
      prods = prods.filter(p => 
        (p['name'] as string).toLowerCase().includes(queryStr) || 
        (p['description'] as string || '').toLowerCase().includes(queryStr) ||
        (p['brand'] as string || '').toLowerCase().includes(queryStr)
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

    // Brands Facet
    if (brands.length > 0) {
      prods = prods.filter(p => brands.includes(p['brand'] as string));
    }

    // Rating Facet (Simulated since real ratings might not exist yet, 
    // but we can assume products have a rating field or default to 5 for now)
    if (ratingLimit > 0) {
      prods = prods.filter(p => (p['rating'] as number || 5) >= ratingLimit);
    }

    return prods;
  });

  resetFilters() {
    this.priceRange.set({min: 0, max: 2000000});
    this.onlyInStock.set(false);
    this.selectedBrands.set([]);
    this.selectedRating.set(0);
    this.searchQuery.set('');
    this.searchQueryInput = '';
  }

  toggleBrand(brand: string) {
    this.selectedBrands.update(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  }

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

  calculateDiscount(p: Record<string, unknown>): number {
    const retail = this.asNumber(p['retailPrice']);
    const price = this.asNumber(p['price']);
    if (retail <= 0) return 0;
    return Math.round(((retail - price) / retail) * 100);
  }
  asRecord(val: unknown): Record<string, unknown> { return val as Record<string, unknown>; }
  asNumber(val: unknown): number { return Number(val) || 0; }
  formatPrice(val: unknown): string {
    return this.dataService.formatAmount(val);
  }

  checkout() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const items = this.cartItems();
    if (items.length === 0) return;

    this.closeAllPanels();
    this.router.navigate(['/checkout']);
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

  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.showScrollTop.set(window.scrollY > 400);
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  ngOnInit() {
    this.watchProducts();
    
    // Set initial category from route data if present
    const routeData = this.route.snapshot.data;
    if (routeData && routeData['category']) {
      this.selectedCategory.set(routeData['category']);
    }

    // Handle direct checkout param
    this.route.queryParams.subscribe(params => {
       if (params['checkout'] === 'true') {
          this.openPanel('cart');
       }
    });
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
    if (this.unsubNotif) this.unsubNotif();
    if (this.unsubStock) this.unsubStock();
    if (this.unsubOrders) this.unsubOrders();
  }

  watchProducts() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.unsub = this.dataService.watchAllProducts();
  }

  markAsRead(id: string) {
    this.dataService.markNotificationRead(id);
  }

  async submitStorefrontReview() {
    const order = this.latestDeliveredOrder();
    const item = this.firstItemToReview();
    const rating = this.storefrontRating();
    const comment = this.storefrontComment();
    
    if (!order || !item || !rating || !comment.trim()) return;
    
    this.submittingStorefrontReview.set(true);
    try {
      await this.dataService.submitReview({
        productId: item['id'] as string,
        orderId: order['id'] as string,
        rating: rating,
        comment: comment,
        customerName: this.authService.user$()?.displayName || 'Client O\'CHAP'
      });
      await this.dataService.markOrderAsReviewed(order['id'] as string);
      
      // Reset rating and comment state
      this.storefrontRating.set(0);
      this.storefrontComment.set('');
      this.showReviewModal.set(false);
    } catch (e) {
      console.error('Error submitting review from storefront:', e);
    } finally {
      this.submittingStorefrontReview.set(false);
    }
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
    this.showAddedToast.set(true);
    setTimeout(() => this.showAddedToast.set(false), 3000);
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
