import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService, OchapOrder } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-supplier-orders',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-[#0D1B2A] tracking-tight uppercase">Commandes clients</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium">Gérez le traitement de vos ventes</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-2xl border border-[#e4e6ea] flex flex-wrap gap-2">
        @for (f of filters; track f.id) {
          <button (click)="currentFilter.set(f.id)"
                  [class]="currentFilter() === f.id ? 'bg-[#FF6200] text-white' : 'bg-[#f0f2f5] text-[#5a5e72] hover:bg-[#e4e6ea]'"
                  class="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
            {{ f.label }}
          </button>
        }
      </div>

      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
        <div class="overflow-x-auto no-scrollbar">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-[#f8f9fa]">
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Référence</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Client</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest hidden lg:table-cell">Contenu</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Total</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Statut</th>
                <th class="px-8 py-5 text-right text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (o of filteredOrders(); track o['id']) {
                <tr class="hover:bg-[#fafafa] transition-colors border-t border-[#e4e6ea]">
                  <td class="px-8 py-6">
                    <span class="text-xs font-black text-[#0D1B2A] font-mono tracking-tight uppercase">#{{ asString(o['id']).slice(-8) }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-[#0D1B2A]">{{ o['customerName'] }}</span>
                      <span class="text-[10px] text-[#9699a8]">{{ o['deliveryZone'] }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-6 hidden lg:table-cell max-w-[200px]">
                    <span class="text-[10px] font-medium text-[#5a5e72] line-clamp-1 italic">
                       {{ getItemsSummary(o['items']) }}
                    </span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-xs font-black text-[#FF6200] font-price tracking-tight">{{ formatPrice(o['total']) }} FCFA</span>
                  </td>
                  <td class="px-8 py-6">
                    <span [class]="getStatusClass(asString(o['status']))" class="text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer">
                      <mat-icon class="scale-50">{{ getStatusIcon(asString(o['status'])) }}</mat-icon>
                      {{ getStatusLabel(asString(o['status'])) }}
                    </span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                       <button (click)="selectedOrder.set(o)" class="w-9 h-9 rounded-xl bg-[#e8f4fd] text-[#0984e3] hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
                          <mat-icon class="scale-75">visibility</mat-icon>
                       </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                   <td colspan="6" class="py-24 text-center opacity-30">
                      <mat-icon class="scale-[3] mb-6">shopping_bag</mat-icon>
                      <h3 class="text-sm font-black uppercase tracking-widest">Aucune commande</h3>
                      <p class="text-[10px] font-medium mt-2">Dès qu'un client achètera vos produits, les commandes apparaîtront ici.</p>
                   </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (selectedOrder(); as o) {
         <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
            <div class="absolute inset-0 bg-[#0D1B2A]/80 backdrop-blur-md" 
                 (click)="selectedOrder.set(null)"
                 role="button"
                 aria-label="Fermer les détails"
                 tabindex="0"
                 (keydown.enter)="selectedOrder.set(null)"></div>
            <div class="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl animate-fade-in border border-[#e4e6ea] overflow-hidden">
               <div class="p-10 border-b border-[#e4e6ea] flex justify-between items-center bg-[#f8f9fa]">
                  <div>
                     <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 block">Détails Commande</span>
                     <h3 class="text-2xl font-black text-dark tracking-tighter uppercase italic">#{{ asString(o.id).slice(-8) }}</h3>
                  </div>
                  <button (click)="selectedOrder.set(null)" class="w-10 h-10 rounded-full bg-white border border-[#e4e6ea] flex items-center justify-center text-muted hover:text-dark">
                     <mat-icon>close</mat-icon>
                  </button>
               </div>
               
               <div class="p-10 max-h-[70vh] overflow-y-auto no-scrollbar space-y-10">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-muted uppercase tracking-widest">Informations Client</h4>
                        <div class="flex items-center gap-4">
                           <div class="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center font-black italic">
                              {{ asString(o.customerName).charAt(0) }}
                           </div>
                           <div>
                              <p class="text-sm font-black text-dark">{{ o.customerName }}</p>
                              <p class="text-[10px] font-bold text-muted uppercase">Client O'CHAP</p>
                           </div>
                        </div>
                     </div>
                     <div class="space-y-4">
                        <h4 class="text-[10px] font-black text-muted uppercase tracking-widest">Destination</h4>
                        <div class="flex items-start gap-4">
                           <mat-icon class="text-primary mt-1 scale-90">location_on</mat-icon>
                           <div>
                              <p class="text-sm font-black text-dark">{{ o.deliveryZone }}</p>
                              <p class="text-[11px] font-medium text-muted leading-relaxed line-clamp-2">{{ o.deliveryAddress }}</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  <div class="space-y-4">
                     <h4 class="text-[10px] font-black text-muted uppercase tracking-widest">Panier Articles</h4>
                     <div class="rounded-3xl border border-[#e4e6ea] overflow-hidden">
                        <table class="w-full border-collapse">
                           <thead class="bg-[#f8f9fa] border-b border-[#e4e6ea]">
                              <tr>
                                 <th class="px-6 py-4 text-left text-[9px] font-black text-muted uppercase tracking-widest">Produit</th>
                                 <th class="px-6 py-4 text-center text-[9px] font-black text-muted uppercase tracking-widest">Qté</th>
                                 <th class="px-6 py-4 text-right text-[9px] font-black text-muted uppercase tracking-widest">Total</th>
                              </tr>
                           </thead>
                           <tbody class="divide-y divide-[#f5f6f8]">
                              @for (item of asArray(o.items); track $index) {
                                 <tr>
                                    <td class="px-6 py-4">
                                       <span class="text-xs font-bold text-dark">{{ asRecord(item)['name'] }}</span>
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                       <span class="text-xs font-black text-muted font-price">x{{ asRecord(item)['quantity'] }}</span>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                       <span class="text-xs font-black text-dark font-price">{{ formatPrice(asNumber(asRecord(item)['price']) * asNumber(asRecord(item)['quantity'])) }} FCFA</span>
                                    </td>
                                 </tr>
                              }
                           </tbody>
                           <tfoot class="bg-[#fafbfc] border-t-2 border-[#e4e6ea]">
                              <tr>
                                 <td colspan="2" class="px-6 py-6 text-right text-[10px] font-black uppercase tracking-widest">Total Transaction</td>
                                 <td class="px-6 py-6 text-right text-lg text-primary font-black font-price tracking-tighter">{{ formatPrice(o.total) }} FCFA</td>
                              </tr>
                           </tfoot>
                        </table>
                     </div>
                  </div>
                  
                  <div class="pt-6 border-t border-[#e4e6ea] flex flex-wrap gap-4">
                     @if (asString(o.status) === 'pending') {
                        <button (click)="updateStatus(asString(o.id), 'confirmed')" class="flex-1 h-14 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                           <mat-icon class="scale-75">check_circle</mat-icon> Confirmer la Commande
                        </button>
                        <button (click)="updateStatus(asString(o.id), 'cancelled')" class="flex-1 h-14 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                           <mat-icon class="scale-75">cancel</mat-icon> Rejeter
                        </button>
                     } @else if (asString(o.status) === 'confirmed') {
                        <button (click)="updateStatus(asString(o.id), 'preparing')" class="flex-1 h-14 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                           <mat-icon class="scale-75">pending_actions</mat-icon> Lancer la Préparation
                        </button>
                     } @else if (asString(o.status) === 'preparing') {
                        <button (click)="updateStatus(asString(o.id), 'shipped')" class="flex-1 h-14 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                           <mat-icon class="scale-75">local_shipping</mat-icon> Expédier la Commande
                        </button>
                     } @else if (asString(o.status) === 'shipped') {
                        <button (click)="updateStatus(asString(o.id), 'delivered')" class="flex-1 h-14 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
                           <mat-icon class="scale-75">done_all</mat-icon> Confirmer la Livraison
                        </button>
                     } @else {
                        <div class="flex-1 text-center py-4 bg-[#f8f9fa] border border-[#e4e6ea] rounded-2xl text-xs font-bold text-[#5a5e72]">
                           Cette commande est : <span [class]="getStatusClass(asString(o.status))" class="ml-1 px-3 py-1.5 rounded-full text-[9px] uppercase font-black tracking-wide">{{ getStatusLabel(asString(o.status)) }}</span>
                        </div>
                     }
                  </div>
               </div>
            </div>
         </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `]
})
export class SupplierOrders implements OnDestroy {
  public authService = inject(AuthService);
  private dataService = inject(DataService);
  
  private rawOrders = this.dataService.orders$;
  public orders = computed(() => this.rawOrders() as OchapOrder[]);
  
  private unsub?: Unsubscribe;
  
  currentFilter = signal('all');
  selectedOrder = signal<OchapOrder | null>(null);

  constructor() {
    effect(() => {
      const user = this.authService.user$();
      const profile = this.authService.profile$();
      
      if (this.unsub) {
        this.unsub();
        this.unsub = undefined;
      }
      
      if (user && profile) {
        if (this.authService.isSupplier()) {
          this.unsub = this.dataService.watchSupplierOrders(user.uid);
        } else {
          this.unsub = this.dataService.watchUserOrders(user.uid);
        }
      }
    });
  }

  filters = [
    { id: 'all', label: 'Toutes' },
    { id: 'pending', label: 'En attente' },
    { id: 'confirmed', label: 'Confirmées' },
    { id: 'shipped', label: 'En livraison' },
    { id: 'delivered', label: 'Livrées' }
  ];

  filteredOrders = computed(() => {
    const all = this.orders();
    const filter = this.currentFilter();
    if (filter === 'all') return all;
    return all.filter(o => o.status === filter);
  });

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  asString(val: unknown): string { return String(val || ''); }
  asArray(val: unknown): Record<string, unknown>[] { return Array.isArray(val) ? val : []; }
  asRecord(val: unknown): Record<string, unknown> { return val as Record<string, unknown>; }
  asNumber(val: unknown): number { return Number(val) || 0; }
  
  formatPrice(val: number | unknown): string {
    return Number(val || 0).toLocaleString('fr-FR');
  }

  getItemsSummary(items: unknown): string {
    if (!Array.isArray(items)) return 'Produits...';
    return (items as { quantity: number, name: string }[]).map(i => `${i.quantity}x ${i.name}`).join(', ');
  }

  async updateStatus(orderId: string, status: string) {
    try {
      await this.dataService.updateOrderStatus(orderId, status);
      if (this.selectedOrder()?.id === orderId) {
        this.selectedOrder.update(o => o ? { ...o, status: status as OchapOrder['status'] } : null);
      }
    } catch (e) {
      console.error('Update status error', e);
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'Préparation';
      case 'shipped': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
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
      case 'cancelled': return 'cancel';
      default: return 'help_outline';
    }
  }

  getStatusIconColor(status: string): string {
    switch(status) {
      case 'pending': return 'text-[#FF6200]';
      case 'confirmed': return 'text-[#0984e3]';
      case 'preparing': return 'text-[#f39c12]';
      case 'shipped': return 'text-[#00b894]';
      case 'delivered': return 'text-[#00925c]';
      case 'cancelled': return 'text-[#f5222d]';
      default: return 'text-[#5a5e72]';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'bg-[#fff3ec] text-[#FF6200]';
      case 'confirmed': return 'bg-[#e8f4fd] text-[#0984e3]';
      case 'preparing': return 'bg-[#fef9e6] text-[#f39c12]';
      case 'shipped': return 'bg-[#e8fdf5] text-[#00b894]';
      case 'delivered': return 'bg-[#eafaf1] text-[#00925c]';
      case 'cancelled': return 'bg-[#fde8e8] text-[#f5222d]';
      default: return 'bg-[#f0f2f5] text-[#5a5e72]';
    }
  }
}
