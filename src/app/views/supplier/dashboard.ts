import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { DataService, OchapOrder, OchapProduct } from '../../services/data.service';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10 animate-fade-in pb-20">
      
      <!-- PERFORMANCE BANNER -->
      <div class="relative overflow-hidden bg-[#0D1B2A] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-navy/20 group">
         <div class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
            <mat-icon class="scale-[5] opacity-10 rotate-12">trending_up</mat-icon>
         </div>
         
         <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div class="space-y-4">
               <div class="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="text-[9px] font-black uppercase tracking-[0.2em]">STATUT BOUTIQUE : PREMIUM</span>
               </div>
               <h2 class="text-3xl md:text-4xl font-black tracking-tighter leading-tight">Bonjour, {{ supplierName() }}. <br><span class="text-primary">{{ dynamicSubtitle() }}</span></h2>
               <p class="text-white/50 text-sm font-medium">{{ currentDate() }}</p>
            </div>
            
            <div class="flex gap-6">
               <div class="h-24 px-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md flex flex-col justify-center">
                  <span class="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Score Qualité</span>
                  <div class="flex items-center gap-2">
                     <span class="text-2xl font-black">{{ averageRating() }}</span>
                     <mat-icon class="text-primary scale-75">star</mat-icon>
                  </div>
               </div>
               <div class="h-24 px-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md flex flex-col justify-center">
                   <span class="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Commandes</span>
                   <span class="text-2xl font-black">{{ totalOrdersCount() }}</span>
               </div>
            </div>
         </div>
      </div>

      <!-- ANALYTICS CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white p-7 rounded-[2.2rem] border border-[#e4e6ea] hover:shadow-xl hover:shadow-gray-200/50 transition-all group relative overflow-hidden">
            <div class="flex justify-between items-start relative z-10 mb-6">
               <div [class]="stat.iconBg" class="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                 <mat-icon [class]="stat.iconColor" class="scale-90">{{ stat.icon }}</mat-icon>
               </div>
               <div [class]="stat.trendClass" class="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-current opacity-70">
                  {{ stat.trend }}
               </div>
            </div>
            <div class="space-y-1 relative z-10">
               <h3 class="text-3xl font-black text-[#0D1B2A] tracking-tight font-price">{{ stat.value }}</h3>
               <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-[0.15em] ml-1">{{ stat.label }}</p>
            </div>
            
            <!-- Sparkline Style Decoration -->
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-[#F5F6F8]">
               <div class="h-full bg-primary/20 transition-all duration-1000" [style.width.%]="50 + (Math.random() * 40)"></div>
            </div>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Revenue Insights (Left 2 cols) -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-[#e4e6ea] shadow-oc-sm">
           <div class="flex items-center justify-between mb-12">
              <div>
                 <h4 class="text-xl font-black text-[#0D1B2A] tracking-tighter">Volume de Ventes.</h4>
                 <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest mt-1">Performance hebdomadaire du magasin</p>
              </div>
              <div class="flex gap-2">
                 <button class="px-4 py-2 rounded-full border border-primary text-primary text-[9px] font-black uppercase tracking-widest">7 Jours</button>
                 <button class="px-4 py-2 rounded-full border border-[#e4e6ea] text-[#9699a8] text-[9px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">30 Jours</button>
              </div>
           </div>
           
           <div class="flex items-end gap-5 h-64 px-4">
              @for (val of weeklyRevenue(); track $index) {
                <div class="flex-1 flex flex-col items-center gap-4">
                   <div class="w-full max-w-[50px] relative group">
                      <div [style.height.px]="val * 2" 
                           class="w-full bg-[#f8f9fa] rounded-t-2xl group-hover:bg-primary/10 transition-colors cursor-pointer relative">
                         <!-- Visual Marker -->
                         <div class="absolute top-0 left-0 w-full h-1.5 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         
                         <!-- Active Bar -->
                         <div [style.height.px]="(val * 2) * 0.4"
                              class="absolute bottom-0 left-0 w-full bg-primary rounded-t-2xl opacity-80 group-hover:opacity-100 transition-all shadow-lg shadow-primary/20"
                              [class.opacity-100]="$last && val > 0"></div>
                      </div>
                      <!-- Value Hover -->
                      <div class="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0D1B2A] text-white px-3 py-1.5 rounded-xl text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0 shadow-xl z-20 pointer-events-none">
                         {{val | number:'1.0-1'}}K CFA
                      </div>
                   </div>
                   <span class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest">{{ getDayLabel($index) }}</span>
                </div>
              }
           </div>
        </div>

        <!-- Inventory Alerts (Right col) -->
        <div class="bg-[#0D1B2A] p-10 rounded-[2.5rem] text-white border border-[#1d2d3d] shadow-2xl shadow-navy/30">
           <div class="mb-10">
              <h4 class="text-xl font-black tracking-tighter">Alertes Stock.</h4>
              <p class="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Articles nécessitant une attention</p>
           </div>
           
           <div class="space-y-6">
              @for (cat of categories(); track cat.label) {
                 <div class="space-y-3">
                    <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span class="text-white/60">{{ cat.label }}</span>
                       <span [style.color]="cat.color">{{ cat.value }}%</span>
                    </div>
                    <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div class="h-full rounded-full transition-all duration-1000 ease-out" 
                            [style.width.%]="cat.value" 
                            [style.background-color]="cat.color"></div>
                    </div>
                 </div>
              }
           </div>

           <div class="mt-12 p-6 rounded-[1.5rem] bg-white/5 border border-white/5 backdrop-blur-sm space-y-4">
              <div class="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Conseil de Croissance</div>
              <p class="text-[11px] font-medium text-white/70 leading-relaxed italic">"Le stock de Réfrigérateurs est bas. Réapprovisionnez avant la promotion de ce weekend pour maximiser vos revenus."</p>
           </div>
        </div>
      </div>

      <!-- QUICK INVENTORY MANAGEMENT -->
      <div class="bg-white rounded-[3rem] border border-[#e4e6ea] shadow-oc-sm overflow-hidden mt-12">
        <div class="px-10 py-8 border-b border-[#e4e6ea] flex items-center justify-between">
           <div>
             <h3 class="text-xl font-black text-[#0D1B2A] tracking-tighter italic">Gestion Rapide du <span class="text-primary">Stock.</span></h3>
             <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest mt-1">Mise à jour instantanée de vos produits</p>
           </div>
           <div class="flex items-center gap-3">
              <span class="text-[9px] font-black uppercase text-muted tracking-widest">Temps réel activé</span>
              <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           </div>
        </div>
        
        <div class="overflow-x-auto no-scrollbar">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-[#fafbfc]">
                <th class="px-10 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Produit</th>
                <th class="px-10 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Prix</th>
                <th class="px-10 py-5 text-center text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Niveau de Stock</th>
                <th class="px-10 py-5 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f5f6f8]">
              @for (p of myProducts(); track p.id) {
                <tr class="hover:bg-[#fafbfc] group transition-all">
                  <td class="px-10 py-6">
                    <div class="flex items-center gap-4">
                       <div class="w-12 h-12 rounded-2xl bg-[#f8f9fa] border border-[#e4e6ea] overflow-hidden group-hover:scale-105 transition-transform">
                          <img [src]="p.imageUrl || 'https://picsum.photos/seed/'+p.id+'/200'" class="w-full h-full object-cover" referrerpolicy="no-referrer" [alt]="p.name">
                       </div>
                       <div class="flex flex-col">
                          <span class="text-xs font-black text-[#0D1B2A]">{{ p.name }}</span>
                          <span class="text-[9px] font-bold text-[#9699a8] uppercase tracking-widest">{{ p.category }}</span>
                       </div>
                    </div>
                  </td>
                  <td class="px-10 py-6">
                     <span class="text-xs font-black text-[#0D1B2A] font-price tracking-tight">{{ formatPrice(p.price) }} FCFA</span>
                  </td>
                  <td class="px-10 py-6 text-center">
                     <div class="flex flex-col items-center gap-2">
                        <span [class]="p.stock > 10 ? 'text-[#00925c]' : 'text-[#FF6200]'" class="text-xs font-black font-price">{{ p.stock }}</span>
                        <div class="w-20 h-1 bg-[#f0f2f5] rounded-full overflow-hidden">
                           <div class="h-full rounded-full transition-all duration-500" 
                                [style.width.%]="(p.stock / 100) * 100 > 100 ? 100 : (p.stock / 100) * 100"
                                [style.background-color]="p.stock > 10 ? '#00925c' : '#FF6200'"></div>
                        </div>
                     </div>
                  </td>
                  <td class="px-10 py-6 text-right">
                     <button (click)="openStockModal(p)" class="px-4 py-2 bg-navy text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-navy/10">Éditer Stock</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- STOCK MODAL -->
      @if (selectedProduct(); as p) {
         <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
            <div class="absolute inset-0 bg-[#0D1B2A]/80 backdrop-blur-md" 
                 (click)="selectedProduct.set(null)"
                 role="button"
                 aria-label="Fermer l'édition"
                 tabindex="0"
                 (keydown.enter)="selectedProduct.set(null)"></div>
            <div class="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl animate-fade-in border border-[#e4e6ea]">
               <button (click)="selectedProduct.set(null)" class="absolute top-8 right-8 text-muted hover:text-dark">
                  <mat-icon>close</mat-icon>
               </button>
               
               <div class="mb-10">
                  <h3 class="text-2xl font-black text-dark tracking-tighter mb-2 italic">Ajuster le <span class="text-primary">Stock.</span></h3>
                  <p class="text-xs text-muted font-medium">Modification immédiate pour : <span class="text-dark font-black">{{ p.name }}</span></p>
               </div>
               
               <div class="grid grid-cols-2 gap-8 mb-10">
                  <div class="p-6 rounded-3xl bg-[#f8f9fa] border border-[#e4e6ea]">
                     <span class="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">Stock Actuel</span>
                     <span class="text-3xl font-black text-dark font-price">{{ p.stock }}</span>
                  </div>
                  <div class="p-6 rounded-3xl bg-[#f8f9fa] border border-[#e4e6ea]">
                     <span class="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">Seuil Alerte</span>
                     <span class="text-3xl font-black text-dark font-price">{{ p.threshold || 10 }}</span>
                  </div>
               </div>
               <div class="space-y-6">
                  <div>
                     <label for="stock-input" class="text-[10px] font-black text-dark uppercase tracking-widest block mb-4">Nouvelle Quantité</label>
                     <div class="flex items-center gap-4">
                        <button (click)="decrementStock()" class="w-14 h-14 rounded-2xl bg-[#0D1B2A] text-white flex items-center justify-center hover:bg-primary transition-all">
                           <mat-icon>remove</mat-icon>
                        </button>
                        <input id="stock-input" type="number" [(ngModel)]="newStockValue" 
                               class="flex-1 h-14 bg-[#f8f9fa] border-2 border-[#e4e6ea] rounded-2xl text-center text-xl font-black font-price focus:border-primary focus:outline-none">
                        <button (click)="incrementStock()" class="w-14 h-14 rounded-2xl bg-[#0D1B2A] text-white flex items-center justify-center hover:bg-primary transition-all">
                           <mat-icon>add</mat-icon>
                        </button>
                     </div>
                  </div>
               </div>
                  
                  <button (click)="saveStock()" [disabled]="isSaving()" class="w-full h-16 bg-[#FF6200] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                     @if (isSaving()) {
                        <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     } @else {
                        <mat-icon class="scale-90">save</mat-icon>
                        Confirmer la mise à jour
                     }
                  </button>
               </div>
            </div>
      }

      <!-- RECENT OPERATIONS -->
      <div class="bg-white rounded-[3rem] border border-[#e4e6ea] shadow-oc-sm overflow-hidden">
        <div class="px-10 py-8 border-b border-[#e4e6ea] flex items-center justify-between">
           <div>
             <h4 class="text-xl font-black text-[#0D1B2A] tracking-tighter">Flux des Commandes.</h4>
             <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest mt-1">Dernières interactions marchandes</p>
           </div>
           <button routerLink="/supplier/orders" class="px-6 py-3 rounded-full bg-[#f8f9fa] border border-[#e4e6ea] text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all">Tout l'historique</button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-[#fafbfc] border-b border-[#e4e6ea]">
                <th class="px-10 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Transaction</th>
                <th class="px-10 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Client</th>
                <th class="px-10 py-5 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Valeur</th>
                <th class="px-10 py-5 text-center text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Statut Logistique</th>
                <th class="px-10 py-5 text-center text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Détails</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f5f6f8]">
              @for (order of recentOrders(); track order['id']) {
                <tr class="hover:bg-[#fafbfc] group transition-all">
                  <td class="px-10 py-6">
                    <span class="text-xs font-black text-[#0D1B2A] font-mono tracking-tighter">#{{ asString(order['id']).slice(-8).toUpperCase() }}</span>
                  </td>
                  <td class="px-10 py-6">
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-[#0D1B2A]">{{ order['customerName'] || 'Particulier O\\'CHAP' }}</span>
                      <span class="text-[9px] font-bold text-[#9699a8] uppercase mt-0.5">{{ order['date'] || 'Instante' }}</span>
                    </div>
                  </td>
                  <td class="px-10 py-6 text-right">
                    <span class="text-xs font-black text-primary font-price">{{ formatPrice(order['total']) }} FCFA</span>
                  </td>
                  <td class="px-10 py-6">
                    <div class="flex justify-center">
                       <span [class]="getStatusClass(asString(order['status']))" class="text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2 border border-current opacity-80 group-hover:opacity-100 transition-all">
                         <mat-icon class="scale-[0.6]">{{ getStatusIcon(asString(order['status'])) }}</mat-icon>
                         {{ getStatusLabel(asString(order['status'])) }}
                       </span>
                    </div>
                  </td>
                  <td class="px-10 py-6">
                    <div class="flex justify-center">
                      <button [routerLink]="['/supplier/orders', order['id']]" class="w-10 h-10 rounded-2xl bg-white border border-[#e4e6ea] text-[#0D1B2A] hover:bg-primary hover:text-white hover:border-primary hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center">
                        <mat-icon class="scale-75">launch</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-32 text-center">
                    <div class="flex flex-col items-center gap-6 opacity-20">
                       <mat-icon class="scale-[3]">receipt_long</mat-icon>
                       <p class="text-[10px] font-black uppercase tracking-[0.3em]">En attente de commandes...</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `]
})
export class SupplierDashboard implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private dataService = inject(DataService);
  private unsubscribeFunctions: (() => void)[] = [];
  
  supplierName = computed(() => {
    const profile = this.authService.profile$() as Record<string, unknown>;
    return (profile?.['businessName'] as string) || (profile?.['displayName'] as string) || (this.authService.user$()?.email?.split('@')[0]) || 'Boutique O\'CHAP';
  });
  currentDate = signal('');
  Math = Math;
  
  // Inventory state
  myProducts = computed(() => this.dataService.products$() as OchapProduct[]);
  selectedProduct = signal<OchapProduct | null>(null);
  newStock = signal<number>(0);
  isSaving = signal(false);

  get newStockValue(): number { return this.newStock(); }
  set newStockValue(v: number) { this.newStock.set(v); }

  dynamicSubtitle = computed(() => {
    const orders = this.dataService.orders$() as OchapOrder[];
    const shop = this.supplierName();
    const pending = orders.filter(o => o.status === 'pending').length;
    
    if (pending > 0) return `${pending} nouvelles commandes à traiter pour ${shop}.`;
    
    const revenue = orders.filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    
    if (revenue > 1000000) return `Performances exceptionnelles sur ${shop} !`;
    if (revenue > 0) return `Vos ventes sont synchronisées pour ${shop}`;
    
    return `Votre boutique ${shop} est connectée au réseau O'CHAP`;
  });
  
  // DYNAMIC STATS BASED ON REAL DATA
  stats = computed(() => {
    const orders = this.dataService.orders$() as OchapOrder[];
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const activeDeliveries = orders.filter(o => o.status === 'shipped').length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    return [
      { 
        label: 'Commandes totales', 
        value: totalOrders.toString(), 
        icon: 'shopping_bag', 
        iconBg: 'bg-[#fff3ec]', 
        iconColor: 'text-[#FF6200]', 
        trend: 'Volume', 
        trendClass: 'bg-[#eafaf1] text-[#00925c]' 
      },
      { 
        label: 'En attente', 
        value: pendingOrders.toString(), 
        icon: 'schedule', 
        iconBg: 'bg-[#e8f4fd]', 
        iconColor: 'text-[#0984e3]', 
        trend: pendingOrders > 0 ? 'Urgent' : 'À jour', 
        trendClass: pendingOrders > 0 ? 'bg-[#fef9e6] text-[#f39c12]' : 'bg-[#eafaf1] text-[#00925c]' 
      },
      { 
        label: 'Livraisons actives', 
        value: activeDeliveries.toString(), 
        icon: 'local_shipping', 
        iconBg: 'bg-[#e8fdf5]', 
        iconColor: 'text-[#00b894]', 
        trend: 'Transition', 
        trendClass: 'bg-[#f0f2f5] text-[#5a5e72]' 
      },
        { 
          label: "Chiffre d'affaires", 
          value: this.formatPrice(totalRevenue), 
          icon: 'payments', 
          iconBg: 'bg-[#fef9e6]', 
          iconColor: 'text-[#f39c12]', 
          trend: 'Revenus', 
          trendClass: 'bg-[#eafaf1] text-[#00925c]' 
        }
    ];
  });

  categories = computed(() => {
    const products = this.dataService.products$();
    if (products.length === 0) return [
      { label: 'Aucun produit', value: 0, color: '#e4e6ea' }
    ];

    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Autres';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = ['#FF6200', '#0984e3', '#00b894', '#f39c12', '#6c5ce7'];
    return Object.entries(counts).map(([label, count], i) => ({
      label,
      value: Math.round((count / products.length) * 100),
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value).slice(0, 4);
  });

  totalOrdersCount = computed(() => this.dataService.orders$().length);
  averageRating = computed(() => {
    const products = this.dataService.products$();
    const rated = products.filter(p => (p.rating || 0) > 0);
    if (rated.length === 0) return 5.0;
    const sum = rated.reduce((acc, p) => acc + (p.rating || 0), 0);
    return (sum / rated.length).toFixed(1);
  });

  weeklyRevenue = computed(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(dateStr => {
      const dayTotal = this.dataService.orders$().filter(o => {
        if (!o.createdAt) return false;
        const ts = o.createdAt as { toDate?: () => { toISOString: () => string } };
        const oDate = ts.toDate ? ts.toDate().toISOString().split('T')[0] : new Date(o.createdAt as string | number).toISOString().split('T')[0];
        return oDate === dateStr && o.status !== 'cancelled';
      }).reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      return dayTotal / 1000; // In K CFA
    });
  });

  maxWeeklyRevenue = computed(() => Math.max(...this.weeklyRevenue(), 100));

  ngOnInit() {
    const d = new Date();
    this.currentDate.set(d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    
    // Subscribe to auth changes to initialize watchers
    toObservable(this.authService.user$).subscribe(user => {
      // Clear previous watchers
      this.clearWatchers();
      
      if (user) {
        this.loadSupplierData(user.uid);
      }
    });
  }

  private clearWatchers() {
    this.unsubscribeFunctions.forEach(unsub => unsub());
    this.unsubscribeFunctions = [];
  }

  loadSupplierData(uid: string) {
    // Basic watchers - push to array for cleanup
    this.unsubscribeFunctions.push(this.dataService.watchSupplierOrders(uid));
    this.unsubscribeFunctions.push(this.dataService.watchSupplierProducts(uid));
    
    // Monitoring - NOTE: watchNotifications is already handled by Layout,
    // but if we want it here too, we must store the unsub.
    // However, to avoid double subscriptions and permissions noise on logout,
    // let's just rely on the Layout for global notifications signal.
    // If we DO need to call it here, we store it:
    // this.unsubscribeFunctions.push(this.dataService.watchNotifications(uid));
    
    this.dataService.monitorStockLevels();
  }

  ngOnDestroy() {
    this.clearWatchers();
  }

  // Effect computed for recent orders
  recentOrders = computed(() => {
    return (this.dataService.orders$() as OchapOrder[]).slice(0, 5);
  });

  decrementStock() {
    this.newStock.update(v => Math.max(0, v - 1));
  }

  incrementStock() {
    this.newStock.update(v => v + 1);
  }

  openStockModal(product: OchapProduct) {
    this.selectedProduct.set(product);
    this.newStock.set(product.stock || 0);
  }

  async saveStock() {
    const prod = this.selectedProduct();
    if (!prod) return;

    this.isSaving.set(true);
    try {
      await this.dataService.updateStock(prod.id, this.newStock());
      this.selectedProduct.set(null);
    } catch (e) {
      console.error('Save stock error', e);
    } finally {
      this.isSaving.set(false);
    }
  }

  getDayLabel(index: number): string {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days[index];
  }

  asString(val: unknown): string { return String(val || ''); }
  
  formatPrice(val: number | string): string {
    return Number(val || 0).toLocaleString('fr-FR');
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'Préparation';
      case 'shipped': return 'En livraison';
      case 'delivered': return 'Livrée';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'pending': return 'schedule';
      case 'confirmed': return 'check_circle';
      case 'preparing': return 'pending';
      case 'shipped': return 'local_shipping';
      case 'delivered': return 'verified';
      default: return 'help_outline';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'bg-[#fff3ec] text-[#FF6200]';
      case 'confirmed': return 'bg-[#e8f4fd] text-[#0984e3]';
      case 'preparing': return 'bg-[#fef9e6] text-[#f39c12]';
      case 'shipped': return 'bg-[#e8fdf5] text-[#00b894]';
      case 'delivered': return 'bg-[#eafaf1] text-[#00925c]';
      default: return 'bg-[#f0f2f5] text-[#5a5e72]';
    }
  }
}
