import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in px-4 lg:px-0">
      <div>
        <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Rapports & Exports</h2>
        <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Génération de rapports d'activité consolidés O'CHAP Afrique</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <!-- Card: Sales Report -->
         <div class="bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm hover:border-primary transition-all group cursor-pointer">
            <div class="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-primary/5">
               <mat-icon class="scale-110">analytics</mat-icon>
            </div>
            <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest mb-3">Ventes & Revenus</h3>
            <p class="text-[10px] text-[#5a5e72] font-bold leading-relaxed mb-10 italic">Export complet des transactions, commissions et marges opérationnelles.</p>
            <button class="w-full h-11 bg-[#f0f2f5] text-[#0D1B2A] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#0D1B2A] hover:text-white transition-all">Générer CSV</button>
         </div>

         <!-- Card: Inventory Report -->
         <div class="bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm hover:border-emerald-600 transition-all group cursor-pointer">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-10 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xl shadow-emerald-600/5">
               <mat-icon class="scale-110">inventory</mat-icon>
            </div>
            <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest mb-3">État des Stocks</h3>
            <p class="text-[10px] text-[#5a5e72] font-bold leading-relaxed mb-10 italic">Analyse des niveaux de stock critiques par marchand et par hub.</p>
            <button class="w-full h-11 bg-[#f0f2f5] text-[#0D1B2A] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white transition-all">Générer PDF</button>
         </div>

         <!-- Card: Logistics Report -->
         <div class="bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm hover:border-blue-600 transition-all group cursor-pointer">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl shadow-blue-600/5">
               <mat-icon class="scale-110">local_shipping</mat-icon>
            </div>
            <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest mb-3">Logistique & Zones</h3>
            <p class="text-[10px] text-[#5a5e72] font-bold leading-relaxed mb-10 italic">Délais moyen de livraison, performance des livreurs et densification des zones.</p>
            <button class="w-full h-11 bg-[#f0f2f5] text-[#0D1B2A] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all">Générer Rapport</button>
         </div>
      </div>

      <!-- Advanced History -->
      <div class="bg-[#0D1B2A] p-10 rounded-[3rem] text-white overflow-hidden relative shadow-2xl">
         <div class="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
         <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div class="space-y-4">
               <h3 class="text-lg font-black tracking-tight uppercase">Planification Automatique</h3>
               <p class="text-[11px] text-white/40 font-bold italic leading-relaxed max-w-sm">Configurez l'envoi automatique des rapports de performance directement sur votre email.</p>
               <div class="flex items-center gap-3 pt-4">
                  <div class="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                  <span class="text-[9px] font-black uppercase tracking-[0.3em]">System Engine v2 active</span>
               </div>
            </div>
            <button class="px-8 h-14 bg-white text-[#0D1B2A] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-2xl shadow-white/10">Configurer Automation</button>
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
export class AdminReports {}
