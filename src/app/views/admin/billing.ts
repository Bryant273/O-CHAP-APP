import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in px-4 lg:px-0">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Facturation & Finance</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Flux financiers et gestion de la facturation inter-partenaires O'CHAP</p>
        </div>
        <button class="bg-[#0D1B2A] text-white h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
           <mat-icon class="scale-75 text-emerald-400">receipt_long</mat-icon> Générer Facture
        </button>
      </div>

      <!-- Financial Snapshot -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div class="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div class="relative z-10">
               <div class="text-[10px] font-black uppercase tracking-widest text-emerald-100/60 mb-2">Encours à facturer</div>
               <div class="text-3xl font-black tracking-tighter">{{formatAmount(totalVolume())}} F</div>
               <div class="mt-6 flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full bg-white/20 text-[8px] font-black uppercase tracking-widest">Global</span>
                  <span class="text-[8px] font-bold text-emerald-100/40 italic">Sync : temps réel</span>
               </div>
            </div>
         </div>
         <div class="bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm">
            <div class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest mb-4 flex items-center gap-2">
               <span class="w-2 h-2 rounded-full bg-blue-500"></span> Commission Plateforme
            </div>
            <div class="text-3xl font-black text-[#0D1B2A] tracking-tighter">{{formatAmount(estimatedCommissions())}} F</div>
            <div class="mt-4 text-[9px] text-[#5a5e72] font-bold italic">Basé sur 10% du volume HT</div>
         </div>
         <div class="bg-[#f8f9fa] p-8 rounded-[2.5rem] border border-[#e4e6ea] border-dashed">
            <div class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest mb-4">Payouts Fournisseurs</div>
            <div class="text-3xl font-black text-[#5a5e72] tracking-tighter">{{formatAmount(payouts())}} F</div>
            <div class="mt-4 text-[9px] text-emerald-600 font-black uppercase italic animate-pulse">En attente de cycle</div>
         </div>
      </div>

      <!-- Recent Invoices Table -->
      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
         <div class="px-8 py-6 border-b border-[#e4e6ea] bg-[#fafbfc] flex items-center justify-between">
            <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest">Factures Récentes</h3>
            <button class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Tout voir</button>
         </div>
         <div class="overflow-x-auto">
            <table class="w-full">
               <thead class="bg-[#fafbfc] border-b border-[#e4e6ea]">
                  <tr>
                     <th class="px-8 py-4 text-left text-[9px] font-black text-[#9699a8] uppercase tracking-widest">ID Facture</th>
                     <th class="px-8 py-4 text-left text-[9px] font-black text-[#9699a8] uppercase tracking-widest">Marchand</th>
                     <th class="px-8 py-4 text-left text-[9px] font-black text-[#9699a8] uppercase tracking-widest">Montant</th>
                     <th class="px-8 py-4 text-left text-[9px] font-black text-[#9699a8] uppercase tracking-widest">Statut</th>
                     <th class="px-8 py-4 text-right text-[9px] font-black text-[#9699a8] uppercase tracking-widest">Action</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-[#f5f6f8]">
                  @if (dataService.suppliers$().length === 0) {
                     <tr><td colspan="5" class="px-8 py-12 text-center text-[10px] font-black text-[#9699a8] italic uppercase tracking-widest">Synchronisation comptable...</td></tr>
                  }
                  @for (s of dataService.suppliers$().slice(0, 5); track s.id) {
                     <tr class="hover:bg-[#fafbfc] transition-all">
                        <td class="px-8 py-4 text-[11px] font-mono font-bold text-[#0D1B2A]">#INV-{{(s.id || '').slice(-6).toUpperCase()}}</td>
                        <td class="px-8 py-4 text-[11px] font-black text-[#0D1B2A]">{{s.name}}</td>
                        <td class="px-8 py-4 text-[11px] font-black text-[#0D1B2A] italic">{{formatAmount((s.productCount || 0) * 12500)}} F</td>
                        <td class="px-8 py-4">
                           <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">Payée</span>
                        </td>
                        <td class="px-8 py-4 text-right">
                           <button class="w-8 h-8 rounded-lg flex items-center justify-center text-[#9699a8] hover:bg-white hover:text-primary transition-all"><mat-icon class="scale-75">cloud_download</mat-icon></button>
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
export class AdminBilling {
  public dataService = inject(DataService);

  totalVolume = computed(() => this.dataService.orders$().reduce((acc, o) => acc + (o.total || 0), 0));
  estimatedCommissions = computed(() => this.totalVolume() * 0.1);
  payouts = computed(() => this.totalVolume() - this.estimatedCommissions());

  formatAmount(val: number | unknown): string {
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(val) || 0));
  }
}
