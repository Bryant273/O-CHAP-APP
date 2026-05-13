import { ChangeDetectionStrategy, Component, inject, OnDestroy, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#F8F9FA] font-sans pb-20">
      <!-- Header Area -->
      <header class="bg-white/80 backdrop-blur-xl border-b border-surface-2 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm shadow-black/[0.02]">
        <button routerLink="/" class="flex items-center gap-2 text-muted hover:text-ink transition-all text-[10px] font-black uppercase tracking-widest group">
          <mat-icon class="scale-75 group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
          Retour Boutique
        </button>
        <div class="oc-brand !text-xl">O'<span>CHAP</span></div>
        <div class="flex items-center gap-4">
           <button routerLink="/notifications" class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-primary hover:text-white transition-all relative">
              <mat-icon class="scale-90">notifications</mat-icon>
           </button>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-6 py-12">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
           <div>
              <h1 class="text-5xl font-black text-ink tracking-tighter mb-2">Historique.</h1>
              <p class="text-[10px] font-black text-muted uppercase tracking-widest">Suivez vos acquisitions sur le réseau O'CHAP Afrique</p>
           </div>
           
           <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative min-w-[240px]">
                 <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-muted scale-75">search</mat-icon>
                 <input [value]="searchQuery()" (input)="updateSearch($event)" 
                        placeholder="Rechercher une référence..." 
                        class="w-full h-12 bg-white rounded-2xl pl-12 pr-4 text-xs font-bold border border-surface-2 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none">
              </div>
              <div class="flex gap-2 bg-white rounded-2xl p-1 border border-surface-2 overflow-x-auto no-scrollbar">
                 @for (s of statuses; track s.id) {
                    <button (click)="selectedStatus.set(s.id)"
                            [class.bg-dark]="selectedStatus() === s.id"
                            [class.text-white]="selectedStatus() === s.id"
                            [class.text-muted]="selectedStatus() !== s.id"
                            class="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95">
                       {{ s.label }}
                    </button>
                 }
              </div>
           </div>
        </div>

        @if (filteredOrders().length > 0) {
          <div class="grid grid-cols-1 gap-6">
            @for (order of filteredOrders(); track order['id']) {
              <div class="bg-white rounded-[2.5rem] border border-surface-2 overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all group duration-500">
                <div class="p-8 md:p-10">
                  
                  <!-- Top Row: ID, Date, Status -->
                  <div class="flex flex-wrap items-start justify-between gap-6 mb-10 pb-10 border-b border-surface-2/60">
                    <div class="flex gap-6">
                       <div class="w-16 h-16 rounded-3xl bg-navy/5 flex items-center justify-center text-navy shrink-0">
                          <mat-icon class="scale-125">package_2</mat-icon>
                       </div>
                       <div>
                         <p class="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Réf. Livraison</p>
                         <h2 class="text-xl font-black text-ink font-mono tracking-tight uppercase">#{{ asString(order['id']).slice(-8) }}</h2>
                         <p class="text-[11px] font-bold text-muted mt-0.5">Expédiée le {{ formatDate(order['createdAt']) }}</p>
                       </div>
                    </div>
                    
                    <div class="flex flex-col items-end gap-3 shrink-0">
                       <span [class]="getStatusClass(asString(order['status']))">
                         {{ getStatusLabel(asString(order['status'])) }}
                       </span>
                       <div class="flex -space-x-4">
                          @for (item of asArray(order['items']).slice(0, 3); track $index) {
                             <div class="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-surface-2 shadow-sm">
                                <img [src]="item['imageUrl']" alt="Aperçu article" class="w-full h-full object-cover">
                             </div>
                          }
                          @if (asArray(order['items']).length > 3) {
                             <div class="w-10 h-10 rounded-full border-2 border-white bg-surface-2 flex items-center justify-center text-[10px] font-black text-ink shadow-sm">
                               +{{ asArray(order['items']).length - 3 }}
                             </div>
                          }
                       </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <!-- Left: Progress & Items -->
                    <div class="lg:col-span-8 space-y-10">
                       
                       <!-- Visual Steps (Timeline) -->
                       <div class="relative pt-2 pb-6 px-1">
                          <div class="absolute top-[35px] left-8 right-8 h-1 bg-surface-2 rounded-full overflow-hidden">
                             <div class="h-full bg-primary transition-all duration-1000" [style.width.%]="getProgressWidth(asString(order['status']))"></div>
                          </div>
                          
                          <div class="flex justify-between relative z-10">
                             @for (step of trackingSteps; track step.id) {
                                <div class="flex flex-col items-center gap-3">
                                   <div [class]="getStepClass(asString(order['status']), step.id)"
                                        class="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 border-white shadow-lg">
                                      <mat-icon class="scale-75">{{ step.icon }}</mat-icon>
                                   </div>
                                   <span [class]="getStepLabelClass(asString(order['status']), step.id)"
                                         class="text-[9px] font-black uppercase tracking-widest text-center max-w-[80px]">
                                      {{ step.label }}
                                   </span>
                                </div>
                             }
                          </div>
                       </div>

                       <!-- Tracking History Log -->
                       @if (order['trackingHistory'] && asArray(order['trackingHistory']).length > 0) {
                          <div class="bg-surface/30 rounded-[2.5rem] border border-surface-2 p-8 shadow-sm">
                             <div class="flex items-center gap-3 mb-8">
                                <mat-icon class="text-primary scale-90">history</mat-icon>
                                <h4 class="text-[10px] font-black text-ink uppercase tracking-[0.2em]">Journal Logistique Détaillé</h4>
                             </div>
                             <div class="space-y-8 relative ml-4 border-l-2 border-primary/20 pl-10 pb-2">
                                @for (log of asArray(order['trackingHistory']); track $index) {
                                   <div class="relative group">
                                      <div class="absolute -left-[45px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-primary shadow-sm group-first:scale-125 transition-transform"></div>
                                      <div>
                                         <div class="flex items-center gap-2 mb-1.5">
                                            <span class="text-[10px] font-black text-ink uppercase tracking-wider">{{ log['status'] }}</span>
                                            <span class="w-1 h-1 bg-muted/40 rounded-full"></span>
                                            <span class="text-[9px] font-bold text-muted opacity-60">{{ formatDate(log['timestamp']) }}</span>
                                         </div>
                                         <p class="text-[11px] font-black text-muted leading-relaxed max-w-xl">{{ log['description'] || 'Opération logistique standard effectuée.' }}</p>
                                         @if (log['location']) {
                                            <div class="flex items-center gap-1.5 mt-2.5 text-[9px] font-black text-primary uppercase tracking-widest italic bg-primary/5 px-3 py-1 rounded-full w-fit">
                                               <mat-icon class="scale-[0.5] -ml-1">location_on</mat-icon>
                                               {{ log['location'] }}
                                            </div>
                                         }
                                      </div>
                                   </div>
                                }
                             </div>
                          </div>
                       }

                       <!-- Items Detail Grid -->
                       <div class="bg-surface/50 rounded-3xl p-6 border border-surface-2/60">
                          <p class="text-[10px] font-black text-muted uppercase tracking-widest mb-6 px-1">Détails de la cargaison</p>
                          <div class="space-y-4">
                            @for (item of asArray(order['items']); track $index) {
                              <div class="flex items-center justify-between pb-4 border-b border-surface-2/40 last:border-0 last:pb-0">
                                 <div class="flex items-center gap-4">
                                    <div class="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-sm shrink-0 border border-surface-2/40">
                                       <img [src]="item['imageUrl']" [alt]="item['name']" class="w-full h-full object-cover">
                                    </div>
                                    <div>
                                       <h4 class="text-xs font-black text-ink uppercase">{{ item['name'] }}</h4>
                                       <p class="text-[10px] font-bold text-muted mt-1 font-price">{{ item['price'] }} FCFA &times; {{ item['quantity'] }}</p>
                                    </div>
                                 </div>
                                 <div class="text-right">
                                    <p class="text-xs font-black text-ink font-price">{{ calculateItemTotal(item) }} FCFA</p>
                                 </div>
                              </div>
                            }
                          </div>
                       </div>
                    </div>

                    <!-- Right: Info Summary & CTA -->
                    <div class="lg:col-span-4 flex flex-col gap-6">
                       
                       <div class="space-y-6 bg-white p-6 rounded-3xl border border-surface-2 shadow-sm">
                          <div class="pb-6 border-b border-surface-2">
                             <p class="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Lieu de livraison</p>
                             <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                   <mat-icon class="scale-75">location_on</mat-icon>
                                </div>
                                <div>
                                   <p class="text-xs font-bold text-ink">{{ order['deliveryZone'] || 'Zone Abidjan' }}</p>
                                   <p class="text-[10px] text-muted truncate max-w-[150px]">{{ order['deliveryAddress'] || 'Adresse non spécifiée' }}</p>
                                </div>
                             </div>
                          </div>

                          <div class="pt-2">
                             <div class="flex justify-between items-end mb-2">
                                <span class="text-[10px] font-black text-muted uppercase tracking-widest">Sous-total</span>
                                <span class="text-xs font-bold text-ink font-price">{{ order['totalAmount'] || order['total'] }} FCFA</span>
                             </div>
                             <div class="flex justify-between items-end mb-6">
                                <span class="text-[10px] font-black text-muted uppercase tracking-widest">Frais logistiques</span>
                                <span class="text-xs font-bold text-emerald-600 uppercase tracking-widest">Gratuit</span>
                             </div>
                             <div class="flex justify-between items-end pt-4 border-t-2 border-dashed border-surface-2">
                                <span class="text-[11px] font-black text-ink uppercase tracking-widest">Total Payé</span>
                                <span class="text-2xl font-black text-primary font-price tracking-tighter">{{ order['totalAmount'] || order['total'] }} <span class="text-[10px] font-sans opacity-40 uppercase">FCFA</span></span>
                             </div>
                          </div>
                       </div>

                       <div class="grid grid-cols-2 gap-3 mt-auto">
                          <button (click)="downloadInvoice(asString(order['id']))"
                                  class="h-14 bg-dark text-white rounded-2xl flex flex-col items-center justify-center gap-0.5 hover:bg-black transition-all active:scale-95 group shadow-xl shadow-black/10">
                             <mat-icon class="scale-75 group-hover:-translate-y-0.5 transition-transform">receipt</mat-icon>
                             <span class="text-[9px] font-black uppercase tracking-widest">Facture PDF</span>
                          </button>
                          <button (click)="reorder(order)" class="h-14 bg-white border-2 border-surface-2 text-ink rounded-2xl flex flex-col items-center justify-center gap-0.5 hover:border-primary/40 hover:text-primary transition-all active:scale-95 group">
                             <mat-icon class="scale-75 group-hover:rotate-180 transition-transform duration-500">refresh</mat-icon>
                             <span class="text-[9px] font-black uppercase tracking-widest">Répéter</span>
                          </button>
                          
                          @if (order['status'] === 'delivered' || order['status'] === 'completed') {
                             <button [routerLink]="['/review', order['id'], asArray(order['items'])[0]['id']]" 
                                     class="col-span-2 h-14 bg-primary text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-navy transition-all active:scale-95 shadow-xl shadow-primary/20">
                                <mat-icon>star</mat-icon>
                                <span class="text-[10px] font-black uppercase tracking-widest">Laisser un avis client</span>
                             </button>
                          }
                          
                          <button routerLink="/after-sales" 
                                  class="col-span-2 h-12 text-[9px] font-black text-muted uppercase tracking-widest hover:text-dark transition-colors flex items-center justify-center gap-2">
                             <mat-icon class="scale-50">support_agent</mat-icon>
                             Besoin d'assistance ? SAV & Garantie
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Enhanced Empty State -->
          <div class="py-32 flex flex-col items-center justify-center text-center px-6">
             <div class="relative mb-8">
                <div class="w-32 h-32 bg-white rounded-[2.5rem] border border-surface-2 flex items-center justify-center shadow-2xl shadow-black/5 animate-pulse">
                   <mat-icon class="text-primary scale-[2.5]">shopping_cart</mat-icon>
                </div>
                <div class="absolute -bottom-2 -right-2 w-12 h-12 bg-navy rounded-2xl flex items-center justify-center text-white border-4 border-[#F8F9FA] shadow-lg">
                   <mat-icon class="scale-75">question_mark</mat-icon>
                </div>
             </div>
             
             <h2 class="text-3xl font-black text-ink tracking-tight mb-4">Horizon Vide.</h2>
             <p class="text-muted text-sm max-w-sm mb-10 leading-relaxed font-medium">Vous n'avez pas encore de transactions enregistrées. Découvrez notre catalogue de produits premium pour commencer votre expérience O'CHAP.</p>
             
             <button routerLink="/" 
                     class="px-10 h-14 bg-navy text-white rounded-2xl flex items-center gap-4 hover:bg-primary transition-all active:scale-95 shadow-2xl shadow-navy/20 group">
                <span class="text-[11px] font-black uppercase tracking-[0.15em]">Lancer le Shopping</span>
                <mat-icon class="group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
             </button>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class OrdersComponent implements OnDestroy {
  public authService = inject(AuthService);
  public cartService = inject(CartService);
  private dataService = inject(DataService);
  private router = inject(Router);

  async downloadInvoice(orderId: string) {
    const url = await this.dataService.generateInvoice(orderId);
    window.open(url, '_blank');
  }
  
  orders = this.dataService.orders$;
  private unsub?: Unsubscribe;

  searchQuery = signal('');
  selectedStatus = signal('all');

  statuses = [
    { id: 'all', label: 'Toutes' },
    { id: 'pending', label: 'En attente' },
    { id: 'confirmed', label: 'Confirmées' },
    { id: 'shipped', label: 'En livraison' },
    { id: 'completed', label: 'Terminées' }
  ];

  trackingSteps = [
    { id: 'pending', label: 'Saisie', icon: 'edit_note' },
    { id: 'confirmed', label: 'Validée', icon: 'verified' },
    { id: 'shipped', label: 'Transport', icon: 'local_shipping' },
    { id: 'delivered', label: 'Reçue', icon: 'inventory' },
    { id: 'completed', label: 'Terminée', icon: 'task_alt' }
  ];

  filteredOrders = computed(() => {
    let list = [...this.orders()];
    const query = this.searchQuery().toLowerCase();
    const status = this.selectedStatus();

    if (query) {
      list = list.filter(o => this.asString(o['id']).toLowerCase().includes(query));
    }

    if (status !== 'all') {
      list = list.filter(o => o['status'] === status);
    }

    return list.sort((a, b) => {
      const t1 = (a['createdAt'] as { seconds?: number })?.seconds || 0;
      const t2 = (b['createdAt'] as { seconds?: number })?.seconds || 0;
      return t2 - t1;
    });
  });

  constructor() {
    effect(() => {
      const user = this.authService.user$();
      if (user) {
        if (this.unsub) this.unsub();
        this.unsub = this.dataService.watchUserOrders(user.uid);
      }
    });
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  updateSearch(e: Event) {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }

  asString(val: unknown): string { return (val as string) || ''; }
  asArray(val: unknown): Record<string, unknown>[] { return (val as Record<string, unknown>[]) || []; }

  calculateItemTotal(item: Record<string, unknown>): string {
    const price = (item['price'] as number) || 0;
    const qty = (item['quantity'] as number) || 0;
    return (price * qty).toLocaleString('fr-FR');
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'pending': return 'Vérification en cours';
      case 'confirmed': return 'Préparation Logistique';
      case 'shipped': return 'Expédition Abidjan';
      case 'delivered': return 'Arrivée à destination';
      case 'completed': return 'Transaction Clôturée';
      case 'cancelled': return 'Commande Annulée';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    const base = "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ";
    switch(status) {
      case 'pending': return base + "bg-amber-500 text-white shadow-amber-500/20";
      case 'confirmed': return base + "bg-blue-500 text-white shadow-blue-500/20";
      case 'shipped': return base + "bg-navy text-white shadow-navy/20";
      case 'delivered': 
      case 'completed': return base + "bg-emerald-500 text-white shadow-emerald-500/20";
      case 'cancelled': return base + "bg-red-500 text-white shadow-red-500/20";
      default: return base + "bg-muted text-white";
    }
  }

  getProgressWidth(status: string): number {
    switch(status) {
      case 'pending': return 10;
      case 'confirmed': return 35;
      case 'shipped': return 65;
      case 'delivered': return 90;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  }

  getStepClass(status: string, stepId: string): string {
    const progress = this.getProgressWidth(status);
    const stepProgress = this.getProgressWidth(stepId);
    
    if (status === 'cancelled') return 'bg-red-50 text-red-200 border-red-50';
    if (progress >= stepProgress) return 'bg-primary text-white border-primary shadow-primary/20 scale-110';
    return 'bg-white text-surface-2 border-surface-2 opacity-50';
  }

  getStepLabelClass(status: string, stepId: string): string {
    const progress = this.getProgressWidth(status);
    const stepProgress = this.getProgressWidth(stepId);
    if (progress >= stepProgress) return 'text-ink font-black scale-105';
    return 'text-muted';
  }

  formatDate(timestamp: unknown): string {
    if (!timestamp) return '...';
    try {
      const ts = timestamp as { toDate?: () => Date };
      const date = ts.toDate ? ts.toDate() : new Date(timestamp as string | number | Date);
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch { return 'Date invalide'; }
  }

  reorder(order: Record<string, unknown>) {
    const items = this.asArray(order['items']);
    items.forEach(item => {
      // Map order item to product format for addToCart
      const product = {
        id: item['id'] as string,
        name: item['name'] as string,
        price: item['price'] as number,
        imageUrl: item['imageUrl'] as string,
        category: item['category'] as string
      };
      // We might want to respect historical quantities
      for(let i=0; i < (item['quantity'] as number); i++) {
        this.cartService.addToCart(product);
      }
    });
    this.router.navigate(['/']);
  }
}
