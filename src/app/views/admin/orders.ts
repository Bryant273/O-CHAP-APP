import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Gestion des Commandes</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Administration globale des transactions O'CHAP Afrique</p>
        </div>
        <div class="flex gap-3">
           <button class="bg-white border border-[#e4e6ea] h-11 px-5 rounded-xl text-xs font-bold text-[#5a5e72] hover:bg-[#f8f9fa] transition-all flex items-center gap-2">
             <mat-icon class="scale-75 text-primary">filter_list</mat-icon> Filtrer
           </button>
           <button class="bg-primary text-white h-11 px-6 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
             <mat-icon class="scale-75">download</mat-icon> Export Global
           </button>
        </div>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[#fafbfc] border-b border-[#e4e6ea]">
              <tr>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Réf</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Client ID</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Montant</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Statut</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Date</th>
                <th class="px-8 py-5 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f5f6f8]">
               @if (dataService.orders$().length === 0) {
                 <tr><td colspan="6" class="px-8 py-12 text-center text-[11px] font-black text-[#9699a8] italic uppercase tracking-widest">Aucune commande synchronisée</td></tr>
               }
               @for (order of dataService.orders$(); track order.id) {
                 <tr class="hover:bg-[#fafbfc] transition-all group">
                   <td class="px-8 py-5">
                      <div class="text-xs font-black text-[#0D1B2A]">#OC-{{order.id.slice(-6).toUpperCase()}}</div>
                   </td>
                   <td class="px-8 py-5">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-bold text-[#0D1B2A] font-mono">{{order.customerUid}}</span>
                      </div>
                   </td>
                   <td class="px-8 py-5 text-xs font-black text-[#0D1B2A] italic">{{formatAmount(order.total)}} FCFA</td>
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
                   <td class="px-8 py-5 text-[10px] text-[#5a5e72] font-black uppercase tracking-tighter">{{formatDate(order.createdAt)}}</td>
                   <td class="px-8 py-5 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button class="w-8 h-8 rounded-lg flex items-center justify-center text-[#9699a8] hover:bg-white hover:text-primary hover:shadow-sm transition-all">
                          <mat-icon class="scale-75">visibility</mat-icon>
                        </button>
                        <button class="w-8 h-8 rounded-lg flex items-center justify-center text-[#9699a8] hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all" title="Confirmer">
                          <mat-icon class="scale-75">check_circle</mat-icon>
                        </button>
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
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminOrders {
  public dataService = inject(DataService);

  formatAmount(val: number | unknown): string {
    return new Intl.NumberFormat('fr-FR').format(Number(val) || 0);
  }

  formatDate(ts: unknown): string {
    if (!ts) return '';
    const dateObj = ts as { toDate?: () => Date };
    const date = dateObj.toDate ? dateObj.toDate() : new Date(ts as string | number);
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  translateStatus(status: string): string {
    const dict: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'dispatched': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return dict[status] || status;
  }
}
