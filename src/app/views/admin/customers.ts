import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in px-4 lg:px-0">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Portefeuille Clients</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Gestion des relations et de la fidélité client O'CHAP Afrique</p>
        </div>
        <div class="flex gap-3">
          <button class="bg-white border border-[#e4e6ea] h-11 px-6 rounded-xl text-xs font-black text-[#5a5e72] hover:bg-[#f8f9fa] transition-all flex items-center gap-2">
            <mat-icon class="scale-75">file_download</mat-icon> Export CRM
          </button>
          <button class="bg-primary text-white h-11 px-6 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary-dark transition-all">
            <mat-icon class="scale-75">person_add</mat-icon> Nouveau Client
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white p-4 rounded-2xl border border-[#e4e6ea] flex flex-wrap gap-4 items-center">
         <div class="flex-1 relative">
            <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-[#9699a8] scale-75">search</mat-icon>
            <input type="text" placeholder="Rechercher un client (Nom, Ville, ID)..." class="w-full pl-12 pr-4 h-11 bg-[#f8f9fa] rounded-xl text-[11px] font-medium border-none focus:ring-2 focus:ring-primary/20">
         </div>
         <select class="h-11 px-4 bg-[#f8f9fa] rounded-xl text-[11px] font-black uppercase tracking-widest border-none">
            <option>Tous les statuts</option>
            <option>Actifs</option>
            <option>Inactifs</option>
         </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         @if (dataService.clients$().length === 0) {
            <div class="col-span-full py-20 bg-white rounded-[2.5rem] border border-[#e4e6ea] border-dashed flex flex-col items-center justify-center text-center">
               <mat-icon class="scale-[2.5] text-[#e4e6ea] mb-8">person_search</mat-icon>
               <p class="text-[12px] font-black text-[#9699a8] uppercase tracking-widest italic">Aucun client trouvé dans le CRM</p>
            </div>
         }
         @for (client of dataService.clients$(); track client.id) {
           <div class="bg-white p-8 rounded-[3rem] border border-[#e4e6ea] shadow-sm hover:border-primary transition-all group">
              <div class="flex items-start justify-between mb-8">
                 <div class="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-xl shadow-indigo-600/5">
                    {{ (client.name || client.displayName || 'C')?.charAt(0) }}
                 </div>
                 <div class="flex flex-col items-end">
                    <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">Fidèle</span>
                    <span class="text-[9px] text-[#9699a8] font-bold mt-2 italic">{{client.city || 'Abidjan'}}</span>
                 </div>
              </div>
              
              <div class="mb-8">
                 <h3 class="text-sm font-black text-[#0D1B2A] group-hover:text-primary transition-colors">{{client.name || client.displayName || 'Client Sans Nom'}}</h3>
                 <p class="text-[10px] text-[#9699a8] font-semibold mt-1">{{client.email || 'Pas d\\'email renseigné'}}</p>
              </div>

              <div class="grid grid-cols-2 gap-4 pt-8 border-t border-[#f5f6f8]">
                 <div>
                    <div class="text-[8px] font-black text-[#9699a8] uppercase tracking-widest">Dernier achat</div>
                    <div class="text-[11px] font-black text-[#0D1B2A] mt-1">12 Mai 2024</div>
                 </div>
                 <div class="text-right">
                    <div class="text-[8px] font-black text-[#9699a8] uppercase tracking-widest">Total Dépenses</div>
                    <div class="text-[11px] font-black text-emerald-600 mt-1">125.000 F</div>
                 </div>
              </div>

              <div class="flex gap-2 mt-8">
                 <button class="flex-1 h-11 rounded-xl bg-[#0D1B2A] text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all">Détails Profil</button>
                 <button class="w-11 h-11 rounded-xl bg-[#f0f2f5] text-[#0D1B2A] flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"><mat-icon class="scale-75">chat_bubble_outline</mat-icon></button>
              </div>
           </div>
         }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminCustomers {
  public dataService = inject(DataService);
}
