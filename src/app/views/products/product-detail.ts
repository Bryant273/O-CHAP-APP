import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { db } from '../../services/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, Unsubscribe, getDoc } from 'firebase/firestore';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

type DetailTab = 'description' | 'specs' | 'store' | 'reviews';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <!-- Breadcrumbs & Nav -->
      <nav class="h-16 px-6 lg:px-12 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-surface-2 sticky top-0 z-50 shadow-sm">
        <button (click)="location.back()" class="flex items-center gap-2 text-muted hover:text-ink transition-all font-black text-[10px] uppercase tracking-widest group">
          <mat-icon class="scale-75 group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
          Retour
        </button>
        <a routerLink="/" class="oc-brand !text-xl">O'<span>CHAP</span></a>
        <div class="flex items-center gap-4">
           <button routerLink="/notifications" class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-primary transition-all relative">
             <mat-icon class="scale-90">notifications_none</mat-icon>
           </button>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto p-6 lg:p-12">
        @if (product()) {
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
            <!-- Left: Gallery -->
            <div class="lg:col-span-7 space-y-6">
              <div class="rounded-[2.5rem] overflow-hidden bg-white border border-surface-2 shadow-2xl shadow-ink/5 aspect-square lg:aspect-[4/5] group relative cursor-zoom-in">
                <img [src]="asRecord(product())['imageUrl'] || 'https://picsum.photos/seed/' + asRecord(product())['id'] + '/1000/1200'" 
                     class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" referrerpolicy="no-referrer"
                     [alt]="asRecord(product())['name']">
                
                <button (click)="toggleWishlist()" 
                        [class.text-primary]="isInWishlist()"
                        class="absolute top-8 right-8 w-14 h-14 rounded-[1.2rem] bg-white/90 backdrop-blur shadow-2xl shadow-ink/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10 group/heart">
                  <mat-icon class="scale-125 transition-transform group-hover/heart:scale-110">{{ isInWishlist() ? 'favorite' : 'favorite_border' }}</mat-icon>
                </button>

                @if (asRecord(product())['oldPrice']) {
                  <div class="absolute top-8 left-8 bg-emerald-500 text-white text-[11px] font-black px-5 py-2 rounded-2xl uppercase shadow-xl tracking-[0.1em]">Offre Spéciale</div>
                }
                
                <div class="absolute bottom-8 left-8 right-8 flex justify-center gap-2 pointer-events-none">
                   @for (d of [1,2,3]; track d) {
                      <div class="w-2 h-2 rounded-full border border-white" [class.bg-white]="d === 1"></div>
                   }
                </div>
              </div>
              
              <!-- Thumbnails -->
              <div class="grid grid-cols-5 gap-4">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="aspect-square rounded-2xl bg-white border border-surface-2 overflow-hidden cursor-pointer hover:border-primary hover:shadow-lg transition-all p-1.5 duration-300">
                    <img [src]="'https://picsum.photos/seed/thumb'+i+asRecord(product())['id']+'/400'" 
                         class="w-full h-full object-cover rounded-xl"
                         [alt]="'Vue ' + i">
                  </div>
                }
              </div>
            </div>
            
            <!-- Right: Principal Info -->
            <div class="lg:col-span-5 flex flex-col pt-2">
              <div class="flex items-center gap-3 mb-6">
                 <div class="flex">
                    @for (star of [1,2,3,4,5]; track star) {
                       <mat-icon class="text-amber-400 scale-[0.6] -mx-1">{{ star <= (asNumber(asRecord(product())['rating']) || 4.5) ? 'star' : 'star_border' }}</mat-icon>
                    }
                 </div>
                 <span class="text-[10px] font-black text-muted tracking-widest uppercase border-l-2 border-surface-2 pl-3">
                   {{asRecord(product())['reviewCount'] || 0}} Évaluations
                 </span>
              </div>

              <div class="flex items-center gap-2 mb-4">
                 <span class="px-3 py-1 bg-navy/5 text-navy text-[9px] font-black rounded-lg uppercase tracking-widest">{{asRecord(product())['category']}}</span>
                 <span class="px-3 py-1 bg-primary/5 text-primary text-[9px] font-black rounded-lg uppercase tracking-widest">{{asRecord(product())['brand']}}</span>
              </div>

              <h1 class="text-4xl lg:text-5xl font-black text-ink mb-6 tracking-tighter leading-[0.9]">{{asRecord(product())['name']}}</h1>
              
              <div class="flex flex-col gap-1 mb-8">
                 @if (asRecord(product())['oldPrice']) {
                    <span class="text-lg text-muted line-through font-bold opacity-40 italic">{{asRecord(product())['oldPrice']}} FCFA</span>
                 }
                 <div class="flex items-baseline gap-4">
                    <span class="text-5xl font-mono font-black text-primary tracking-tighter">{{asRecord(product())['price']}} <span class="text-xs font-sans opacity-40">FCFA</span></span>
                    <span class="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Économisez {{ (asNumber(asRecord(product())['oldPrice']) || 0) > 0 ? asNumber(asRecord(product())['oldPrice']) - asNumber(asRecord(product())['price']) : 0 }} FCFA</span>
                 </div>
              </div>

              <!-- Inventory Status -->
              <div class="bg-white rounded-[2rem] p-8 border border-surface-2 mb-10 space-y-6 shadow-sm shadow-ink/5">
                <div>
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-[10px] font-black text-muted uppercase tracking-widest">Disponibilité Magasin</span>
                    <span [class]="asNumber(asRecord(product())['stock']) > 10 ? 'text-emerald-600' : 'text-red-500'" 
                          class="text-[10px] font-black uppercase tracking-widest">
                      {{ asNumber(asRecord(product())['stock']) > 10 ? 'En Stock' : 'Stock Limité' }}
                    </span>
                  </div>
                  <div class="h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all duration-1000" 
                         [style.width.%]="(asNumber(asRecord(product())['stock']) / 100) * 100 > 100 ? 100 : (asNumber(asRecord(product())['stock']) / 100) * 100"></div>
                  </div>
                  <p class="mt-3 text-[12px] font-bold text-ink leading-relaxed">Il reste <span class="font-black text-primary">{{asRecord(product())['stock']}} articles</span> dans l'entrepôt principal Côte d'Ivoire.</p>
                </div>

                <div class="grid grid-cols-2 gap-4 pt-6 border-t border-surface-2">
                   <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                         <mat-icon class="scale-75">local_shipping</mat-icon>
                      </div>
                      <div>
                         <p class="text-[9px] font-black uppercase text-muted">Expédition</p>
                         <p class="text-[10px] font-bold text-ink">48h chrono</p>
                      </div>
                   </div>
                   <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                         <mat-icon class="scale-75">verified_user</mat-icon>
                      </div>
                      <div>
                         <p class="text-[9px] font-black uppercase text-muted">Garantie</p>
                         <p class="text-[10px] font-bold text-ink">Certifiée 2 ans</p>
                      </div>
                   </div>
                </div>
              </div>

              <!-- Main Actions -->
              <div class="grid grid-cols-1 gap-4">
                <button (click)="addToCart()" class="h-16 bg-navy text-white rounded-[1.2rem] flex items-center justify-center gap-4 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-navy/20 hover:bg-primary transition-all active:scale-95 group">
                   <mat-icon class="group-hover:scale-110 transition-transform">shopping_bag</mat-icon>
                   Ajouter au panier
                </button>
                <div class="grid grid-cols-2 gap-4">
                   <button class="h-14 bg-white border-2 border-surface-2 text-ink rounded-[1.2rem] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:border-navy transition-all active:scale-95">
                      <mat-icon class="scale-90">payments</mat-icon>
                      Acheter Direct
                   </button>
                   <button class="h-14 bg-white border-2 border-surface-2 text-ink rounded-[1.2rem] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:border-navy transition-all active:scale-95">
                      <mat-icon class="scale-90">share</mat-icon>
                      Partager
                   </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Structured Info Sections (Jumia Style) -->
          <div class="bg-white rounded-[3rem] border border-surface-2 overflow-hidden shadow-xl shadow-ink/[0.02]">
             <!-- Tabs Nav -->
             <div class="flex border-b border-surface-2 bg-surface-2/30 px-6 lg:px-12 overflow-x-auto no-scrollbar">
                @for (tab of ['description', 'specs', 'store', 'reviews']; track tab) {
                   <button (click)="activeTab.set(asTab(tab))"
                           [class.border-primary]="activeTab() === tab"
                           [class.text-dark]="activeTab() === tab"
                           [class.text-muted]="activeTab() !== tab"
                           class="py-8 px-8 border-b-4 border-transparent text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap">
                      {{ getTabLabel(tab) }}
                   </button>
                }
             </div>

             <!-- Tab Content -->
             <div class="p-8 lg:p-16">
                <!-- Description Tab -->
                @if (activeTab() === 'description') {
                   <div class="max-w-4xl animate-fade-up">
                      <h2 class="text-3xl font-black text-ink mb-8 tracking-tight italic">Présentation de <span class="text-primary">l'Innovation.</span></h2>
                      <div class="prose prose-sm text-muted font-medium leading-relaxed space-y-6">
                        <p class="text-base">{{asRecord(product())['description']}}</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 py-12 border-y border-surface-2">
                           <div class="space-y-2">
                              <h4 class="font-black text-ink uppercase text-xs tracking-widest">Performance</h4>
                              <p class="text-[13px]">Bénéficiez d’une technologie de pointe optimisée pour les variations électriques fréquentes, assurant longévité et sécurité.</p>
                           </div>
                           <div class="space-y-2">
                              <h4 class="font-black text-ink uppercase text-xs tracking-widest">Économie</h4>
                              <p class="text-[13px]">Classe énergétique certifiée O'CHAP pour réduire vos factures mensuelles jusqu'à 25% par rapport aux anciens modèles.</p>
                           </div>
                        </div>
                      </div>
                   </div>
                }

                <!-- Specs Tab -->
                @if (activeTab() === 'specs') {
                   <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-up">
                      <div>
                        <h3 class="text-xl font-black text-ink mb-8 tracking-tight">Fiche <span class="text-primary">Technique.</span></h3>
                        <div class="space-y-2">
                           @for (key of getSpecKeys(); track key) {
                              <div class="flex items-center justify-between py-4 border-b border-surface-2 last:border-0 grow">
                                 <span class="text-[10px] font-black text-muted uppercase tracking-widest">{{ key }}</span>
                                 <span class="text-sm font-bold text-ink">{{ getSpecValue(key) }}</span>
                              </div>
                           } @empty {
                              <div class="py-4 text-[13px] text-muted italic">Les spécifications détaillées sont en cours de mise à jour par le fournisseur.</div>
                           }
                        </div>
                      </div>
                      <div class="bg-surface p-8 rounded-[2rem] border border-surface-2">
                         <div class="flex gap-4 mb-6">
                            <mat-icon class="text-primary scale-125">verified</mat-icon>
                            <div>
                               <h4 class="text-sm font-black text-ink uppercase tracking-widest mb-1">Qualité Certifiée</h4>
                               <p class="text-[11px] text-muted leading-relaxed">Chaque article passe par notre centre de contrôle technique O'CHAP Abidjan avant livraison.</p>
                            </div>
                         </div>
                         <div class="flex gap-4">
                            <mat-icon class="text-primary scale-125">settings_suggest</mat-icon>
                            <div>
                               <h4 class="text-sm font-black text-ink uppercase tracking-widest mb-1">Entretien & SAV</h4>
                               <p class="text-[11px] text-muted leading-relaxed">Contrat d'entretien disponible sur simple appel au +225 01 02 03 04.</p>
                            </div>
                         </div>
                      </div>
                   </div>
                }

                <!-- Store Tab -->
                @if (activeTab() === 'store') {
                   <div class="flex flex-col lg:flex-row gap-16 animate-fade-up">
                      <div class="lg:w-1/3">
                         <div class="bg-navy rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                           <div class="relative z-10">
                              <p class="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-8">Boutique Officielle</p>
                              <h3 class="text-4xl font-black tracking-tighter mb-4 leading-none">{{ supplier()?.['name'] || asRecord(product())['brand'] }}</h3>
                              <div class="flex items-center gap-2 mb-10">
                                 <mat-icon class="text-emerald-400 scale-75">verified</mat-icon>
                                 <span class="text-[10px] font-black uppercase tracking-widest">Vendeur Premium O'CHAP</span>
                              </div>
                              
                              <button class="w-full h-12 bg-white text-navy rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95">Voir la Boutique</button>
                           </div>
                           <mat-icon class="absolute -right-8 -bottom-8 text-white/5 scale-[6] rotate-12 group-hover:rotate-0 transition-transform duration-700">storefront</mat-icon>
                         </div>
                      </div>
                      
                      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 content-center">
                         <div class="p-8 rounded-[2rem] border border-surface-2 bg-white flex flex-col items-center text-center">
                            <p class="text-4xl font-black text-emerald-500 mb-2 font-mono">{{ supplier()?.['rating'] || '4.8' }}</p>
                            <p class="text-[10px] font-black text-ink uppercase tracking-widest">Note Fiabilité</p>
                            <p class="text-[9px] text-muted mt-4">Basé sur les retours clients et délais de livraison.</p>
                         </div>
                         <div class="p-8 rounded-[2rem] border border-surface-2 bg-white flex flex-col items-center text-center">
                            <p class="text-4xl font-black text-navy mb-2 font-mono">92%</p>
                            <p class="text-[10px] font-black text-ink uppercase tracking-widest">Taux de réponse</p>
                            <p class="text-[9px] text-muted mt-4">Le fournisseur répond en moyenne en moins de 4h.</p>
                         </div>
                      </div>
                   </div>
                }

                <!-- Reviews Tab -->
                @if (activeTab() === 'reviews') {
                   <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-fade-up">
                      <div class="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-8">
                         <div class="bg-surface rounded-3xl p-10 text-center border border-surface-2">
                            <p class="text-6xl font-black text-ink font-mono tracking-tighter mb-4">{{ (asNumber(asRecord(product())['rating']) || 4.5).toFixed(1) }}</p>
                            <div class="flex justify-center mb-4">
                                @for (star of [1,2,3,4,5]; track star) {
                                   <mat-icon class="text-amber-400 scale-[1.2] -mx-0.5">{{ star <= (asNumber(asRecord(product())['rating']) || 4.5) ? 'star' : 'star_border' }}</mat-icon>
                                }
                            </div>
                            <p class="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-12">Total de {{ reviews().length }} avis</p>
                            
                            <button class="w-full h-14 bg-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-black/10">Laissez votre avis</button>
                         </div>
                      </div>
                      
                      <div class="lg:col-span-8 space-y-4">
                         @for (review of reviews(); track review['id']) {
                           <div class="bg-white p-8 rounded-[2rem] border border-surface-2 hover:shadow-xl hover:shadow-black/[0.02] transition-all group">
                              <div class="flex justify-between items-start mb-6">
                                 <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-[1.2rem] bg-navy text-white flex items-center justify-center font-black text-sm shadow-lg shadow-navy/10 group-hover:scale-110 transition-transform">
                                       {{asString(review['customerName']).charAt(0)}}
                                    </div>
                                    <div>
                                       <h4 class="text-sm font-black text-ink mb-1">{{ review['customerName'] }}</h4>
                                       <div class="flex items-center gap-2">
                                          <div class="flex">
                                             @for (s of [1,2,3,4,5]; track s) {
                                                <mat-icon class="text-amber-400 scale-[0.5] -mx-1.5">{{ s <= asNumber(review['rating']) ? 'star' : 'star_border' }}</mat-icon>
                                             }
                                          </div>
                                          <span class="text-[9px] font-bold text-muted uppercase tracking-widest ml-2">Achat Vérifié</span>
                                       </div>
                                    </div>
                                 </div>
                                 <span class="text-[10px] font-black text-muted uppercase tracking-widest">{{ formatDate(review['createdAt']) }}</span>
                              </div>
                              <p class="text-sm leading-relaxed text-muted font-medium italic">"{{ review['comment'] }}"</p>
                           </div>
                         } @empty {
                            <div class="py-24 flex flex-col items-center justify-center text-center bg-surface rounded-[3rem] border-2 border-dashed border-surface-2 opacity-30">
                               <mat-icon class="scale-[3] mb-6">rate_review</mat-icon>
                               <h3 class="text-base font-black uppercase tracking-widest">Aucune évaluation.</h3>
                               <p class="text-xs max-w-[200px] mt-2">Partagez votre expérience O'CHAP après votre achat !</p>
                            </div>
                         }
                      </div>
                   </div>
                }
             </div>
          </div>
        } @else {
          <div class="py-60 text-center flex flex-col items-center justify-center">
            <div class="relative mb-8">
               <div class="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
               <div class="absolute inset-x-0 inset-y-0 flex items-center justify-center">
                  <div class="w-2 h-2 bg-primary rounded-full animate-ping"></div>
               </div>
            </div>
            <p class="text-muted font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initialisation O'CHAP Engine...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  public route = inject(ActivatedRoute);
  public location = inject(Location);
  public authService = inject(AuthService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  product = signal<Record<string, unknown> | null>(null);
  reviews = signal<Record<string, unknown>[]>([]);
  supplier = signal<Record<string, unknown> | null>(null);
  activeTab = signal<DetailTab>('description');
  
  private subs: Unsubscribe[] = [];

  // Helper getters
  isInWishlist = computed(() => {
    const prod = this.product();
    return prod ? this.wishlistService.isInWishlist(prod['id'] as string) : false;
  });

  asRecord(val: unknown): Record<string, unknown> { return val as Record<string, unknown>; }
  asNumber(val: unknown): number { return Number(val) || 0; }
  asString(val: unknown): string { return (val as string) || ''; }
  asTab(val: string): DetailTab { return val as DetailTab; }

  getTabLabel(tab: string): string {
    switch(tab) {
      case 'description': return 'Description';
      case 'specs': return 'Fiche Technique';
      case 'store': return 'Informations Boutique';
      case 'reviews': return 'Avis Clients';
      default: return tab;
    }
  }

  getSpecKeys(): string[] {
    const prod = this.product();
    if (!prod || !prod['technicalSpecs']) return [];
    try {
      const specs = JSON.parse(prod['technicalSpecs'] as string);
      return Object.keys(specs);
    } catch {
      return [];
    }
  }

  getSpecValue(key: string): string {
    const prod = this.product();
    if (!prod || !prod['technicalSpecs']) return '';
    try {
      const specs = JSON.parse(prod['technicalSpecs'] as string);
      return specs[key];
    } catch {
      return '';
    }
  }

  formatDate(timestamp: unknown): string {
    if (!timestamp) return '...';
    try {
      let date: Date;
      if (this.isFirestoreTimestamp(timestamp)) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp as string | number);
      }
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    } catch { return '...'; }
  }

  private isFirestoreTimestamp(val: unknown): val is { toDate: () => Date } {
    const candidate = val as { toDate?: unknown };
    return !!candidate && typeof candidate === 'object' && typeof candidate.toDate === 'function';
  }

  addToCart() {
    const prod = this.product();
    if (prod) {
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.cartService.addToCart(prod as Record<string, unknown>);
      // On pourrait déclencher un feedback visuel ici
    }
  }

  toggleWishlist() {
    const prod = this.product();
    if (prod) {
      if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.wishlistService.toggleWishlist(prod['id'] as string);
    }
  }

  async fetchSupplier(supplierId: string) {
    try {
      const snap = await getDoc(doc(db, 'suppliers', supplierId));
      if (snap.exists()) {
        this.supplier.set({ id: snap.id, ...snap.data() });
      }
    } catch (e) {
      console.error('Failed to fetch supplier', e);
    }
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.watchProduct(id);
      this.watchReviews(id);
    }
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  ngOnDestroy() {
    this.subs.forEach(unsub => unsub());
  }

  watchProduct(id: string) {
    const unsub = onSnapshot(doc(db, 'products', id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Record<string, unknown>;
        this.product.set(data);
        if (data['supplierId']) {
          this.fetchSupplier(data['supplierId'] as string);
        }
      }
    });
    this.subs.push(unsub);
  }

  watchReviews(productId: string) {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      this.reviews.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    this.subs.push(unsub);
  }
}
