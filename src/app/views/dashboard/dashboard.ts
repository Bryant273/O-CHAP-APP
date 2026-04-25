import {ChangeDetectionStrategy, Component, inject, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {DataService} from '../../services/data.service';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Dashboard Global</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Vue consolidée du réseau O'CHAP Afrique — {{currentDate}}</p>
        </div>
        <div class="flex gap-3">
          <button class="h-10 px-4 bg-white border border-[#e4e6ea] rounded-xl text-xs font-bold text-[#5a5e72] hover:bg-[#fcfcfd] transition-all flex items-center gap-2">
            <mat-icon class="scale-75">download</mat-icon> Exporter
          </button>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <div class="bg-white p-5 rounded-[2rem] border border-[#e4e6ea] shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-orange-50 text-primary flex items-center justify-center mb-4"><mat-icon>payments</mat-icon></div>
          <div class="text-2xl font-black text-[#0D1B2A]">{{formatAmount(totalRevenue())}}</div>
          <div class="text-[10px] font-bold text-[#5a5e72] uppercase tracking-wider">Revenus Réels (CFA)</div>
          <div class="mt-3 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-min whitespace-nowrap">
            <mat-icon class="scale-50">trending_up</mat-icon> Live Sync
          </div>
        </div>
        
        <div class="bg-white p-5 rounded-[2rem] border border-[#e4e6ea] shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><mat-icon>shopping_bag</mat-icon></div>
          <div class="text-2xl font-black text-[#0D1B2A]">{{orderCount()}}</div>
          <div class="text-[10px] font-bold text-[#5a5e72] uppercase tracking-wider">Commandes Globales</div>
          <div class="mt-3 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-min whitespace-nowrap">
            Total plateforme
          </div>
        </div>

        <div class="bg-white p-5 rounded-[2rem] border border-[#e4e6ea] shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"><mat-icon>people</mat-icon></div>
          <div class="text-2xl font-black text-[#0D1B2A]">{{clientCount()}}</div>
          <div class="text-[10px] font-bold text-[#5a5e72] uppercase tracking-wider">Clients Certifiés</div>
          <div class="mt-3 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-min whitespace-nowrap">
            Base active
          </div>
        </div>

        <div class="bg-white p-5 rounded-[2rem] border border-[#e4e6ea] shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><mat-icon>storefront</mat-icon></div>
          <div class="text-2xl font-black text-[#0D1B2A]">{{supplierCount()}}</div>
          <div class="text-[10px] font-bold text-[#5a5e72] uppercase tracking-wider">Marchands Partenaires</div>
          <div class="mt-3 flex items-center gap-1.5 text-[10px] font-black text-[#5a5e72] bg-[#f0f2f5] px-2 py-0.5 rounded-full w-min whitespace-nowrap">
            Actifs
          </div>
        </div>

        <div class="bg-white p-5 rounded-[2rem] border border-[#e4e6ea] shadow-sm" [class.border-red-200]="lowStockCount() > 0">
          <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4"><mat-icon>priority_high</mat-icon></div>
          <div class="text-2xl font-black" [class.text-red-600]="lowStockCount() > 0">{{lowStockCount()}}</div>
          <div class="text-[10px] font-bold text-[#5a5e72] uppercase tracking-wider">Stocks Critiques</div>
          <div class="mt-3 flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full w-min whitespace-nowrap"
               [class.text-red-600]="lowStockCount() > 0" [class.bg-red-50]="lowStockCount() > 0"
               [class.text-emerald-600]="lowStockCount() === 0" [class.bg-emerald-50]="lowStockCount() === 0">
            {{lowStockCount() > 0 ? 'Urgent' : 'Optimale'}}
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm">
           <div class="flex items-center justify-between mb-8">
             <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest">Revenus — 7 derniers jours</h3>
             <span class="text-[10px] font-bold text-primary italic">Synchronisation en direct</span>
           </div>
           <div class="flex items-end gap-3 h-48 mb-4">
              @for (v of weeklyRevenue(); track $index) {
                <div class="flex-1 flex flex-col items-center gap-3 group relative">
                   <div class="w-full bg-[#f0f2f5] hover:bg-primary/20 transition-all rounded-t-lg relative cursor-pointer" 
                        [style.height.%]="(v / (maxRevenue() || 1)) * 100">
                      <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0D1B2A] text-white text-[9px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap z-10 border border-white/10 font-black">
                        {{v.toFixed(0)}}K CFA
                      </div>
                      @if ($index === 6) { <div class="absolute inset-0 bg-primary rounded-t-lg shadow-lg shadow-primary/20"></div> }
                   </div>
                   <span class="text-[10px] font-bold text-[#9699a8] uppercase">{{daysLabel[$index]}}</span>
                </div>
              }
           </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm h-full">
           <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest mb-8">Alertes Critiques</h3>
           <div class="space-y-4">
              @if (dataService.notifications$().length === 0) {
                 <div class="py-12 text-center">
                    <mat-icon class="scale-150 text-[#e4e6ea] mb-4">check_circle_outline</mat-icon>
                    <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest">Tout est sous contrôle</p>
                 </div>
              }
              @for (notif of dataService.notifications$().slice(0, 4); track notif.id) {
                <div class="p-4 rounded-2xl bg-[#fafbfc] border border-[#e4e6ea] flex items-start gap-3 animate-fade-in group hover:border-primary/30 transition-all">
                   <div class="w-8 h-8 rounded-lg bg-orange-50 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <mat-icon class="scale-75">warning</mat-icon>
                   </div>
                   <div class="min-w-0">
                      <div class="text-[11px] font-black text-[#0D1B2A] truncate">{{notif.title}}</div>
                      <div class="text-[9px] font-bold text-[#5a5e72] mt-1 line-clamp-2">{{notif.message}}</div>
                   </div>
                </div>
              }
           </div>
        </div>
      </div>

      <!-- Orders & Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden h-full">
           <div class="px-8 py-6 border-b border-[#e4e6ea] flex items-center justify-between">
              <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest">Dernières transactions</h3>
              <button class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Flux complet</button>
           </div>
           <div class="overflow-x-auto">
             <table class="w-full">
               <thead>
                 <tr class="bg-[#fafbfc] border-b border-[#e4e6ea]">
                   <th class="px-8 py-4 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-widest whitespace-nowrap">Réf</th>
                   <th class="px-8 py-4 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-widest whitespace-nowrap">Montant</th>
                   <th class="px-8 py-4 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-widest whitespace-nowrap">Statut</th>
                   <th class="px-8 py-4 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-widest whitespace-nowrap">Date</th>
                 </tr>
               </thead>
               <tbody class="divide-y divide-[#f5f6f8]">
                  @if (dataService.orders$().length === 0) {
                    <tr><td colspan="4" class="px-8 py-12 text-center text-[11px] font-bold text-[#9699a8] italic">Aucune commande enregistrée pour le moment</td></tr>
                  }
                  @for (order of dataService.orders$().slice(0, 6); track order.id) {
                    <tr class="hover:bg-[#fafbfc] transition-all group">
                      <td class="px-8 py-5">
                         <div class="text-xs font-black text-[#0D1B2A] group-hover:text-primary transition-colors">#OC-{{order.id.slice(-6).toUpperCase()}}</div>
                      </td>
                      <td class="px-8 py-5 text-xs font-black text-[#0D1B2A] italic">{{formatOrderAmount(order.total)}} CFA</td>
                      <td class="px-8 py-5">
                         <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all"
                               [class.bg-emerald-50]="order.status === 'delivered' || order.status === 'confirmed'"
                               [class.text-emerald-600]="order.status === 'delivered' || order.status === 'confirmed'"
                               [class.border-emerald-100]="order.status === 'delivered' || order.status === 'confirmed'"
                               [class.bg-orange-50]="order.status === 'pending'"
                               [class.text-primary]="order.status === 'pending'"
                               [class.border-orange-100]="order.status === 'pending'"
                               [class.bg-red-50]="order.status === 'cancelled'"
                               [class.text-red-500]="order.status === 'cancelled'"
                               [class.border-red-100]="order.status === 'cancelled'">
                           {{translateStatus(order.status)}}
                         </span>
                      </td>
                      <td class="px-8 py-5 text-right text-[10px] font-bold text-[#9699a8]">{{formatDate(order.createdAt)}}</td>
                    </tr>
                  }
               </tbody>
             </table>
           </div>
        </div>

        <div class="bg-[#0D1B2A] p-8 rounded-[2.5rem] text-white space-y-8 h-full relative overflow-hidden">
           <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"></div>
           <h3 class="text-sm font-black uppercase tracking-widest flex items-center justify-between">
              <span class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Live Hub Logistics
              </span>
              <mat-icon class="scale-75 text-white/20">satellite_alt</mat-icon>
           </h3>
           <div class="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-white/10">
              @if (dataService.orders$().length === 0) {
                 <div class="pl-10 text-[10px] font-bold text-white/30 italic">En attente de flux...</div>
              }
              @for (order of dataService.orders$().slice(0, 5); track order.id) {
                <div class="relative pl-10 group cursor-default">
                   <div class="absolute left-0 top-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center z-10 group-hover:border-primary/50 transition-all">
                      <mat-icon class="scale-75 text-primary">local_shipping</mat-icon>
                   </div>
                   <div>
                      <div class="text-[11px] font-bold text-white group-hover:text-primary transition-colors">Action Logistique #OC-{{order.id.slice(-4)}}</div>
                      <div class="text-[10px] text-white/40 leading-relaxed mt-1 uppercase font-black tracking-widest">{{translateStatus(order.status)}}</div>
                      <div class="text-[9px] text-white/20 font-black uppercase mt-2 tracking-tighter">{{formatDate(order.updatedAt || order.createdAt)}}</div>
                   </div>
                </div>
              }
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class Dashboard {
  public dataService = inject(DataService);
  public authService = inject(AuthService);
  
  currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  daysLabel = ['L','M','M','J','V','S','D'];

  // KPIs RÉELS CALCULÉS DYNAMIQUEMENT
  totalRevenue = computed(() => {
    return this.dataService.orders$()
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (Number(o['totalAmount']) || 0), 0);
  });

  orderCount = computed(() => this.dataService.orders$().length);
  supplierCount = computed(() => this.dataService.suppliers$().length);
  clientCount = computed(() => this.dataService.users$().filter(u => u['role'] === 'client').length);
  lowStockCount = computed(() => this.dataService.products$().filter(p => (Number(p['stockLevel']) || 0) <= 10).length);

  // LOGIQUE GRAPHIQUE 7 JOURS RÉELLE
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
      return dayTotal / 1000; // Unité en K CFA pour le graphe
    });
  });

  maxRevenue = computed(() => Math.max(...this.weeklyRevenue(), 100));

  formatAmount(val: number): string {
    return new Intl.NumberFormat('fr-FR').format(val);
  }

  formatOrderAmount(val: number | string | unknown): string {
    return new Intl.NumberFormat('fr-FR').format(Number(val) || 0);
  }

  formatDate(ts: unknown): string {
    if (!ts) return '';
    const dateObj = ts as { toDate?: () => Date };
    const date = dateObj.toDate ? dateObj.toDate() : new Date(ts as string | number);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  translateStatus(status: string): string {
    const dict: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'dispatched': 'En transit',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return dict[status] || status;
  }
}
