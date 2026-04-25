import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-suppliers',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Partenaires Fournisseurs</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Gestion de l'écosystème marchand O'CHAP Afrique</p>
        </div>
        <button class="bg-primary text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
          <mat-icon class="scale-75">person_add</mat-icon> Nouveau Marchand
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         @if (dataService.suppliers$().length === 0) {
            <div class="col-span-full py-20 bg-white rounded-[2.5rem] border border-[#e4e6ea] border-dashed flex flex-col items-center justify-center text-center">
               <mat-icon class="scale-[2.5] text-[#e4e6ea] mb-8">storefront</mat-icon>
               <p class="text-[12px] font-black text-[#9699a8] uppercase tracking-widest">Aucun marchand synchronisé</p>
            </div>
         }
         @for (supplier of dataService.suppliers$(); track supplier.id) {
           <div class="bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm hover:border-primary transition-all group relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-12 h-12 bg-primary/5 rounded-full"></div>
              
              <div class="flex items-center gap-4 mb-6">
                 <div class="w-12 h-12 rounded-2xl bg-[#0D1B2A] text-white flex items-center justify-center font-black text-lg group-hover:bg-primary transition-colors">
                    {{ (supplier.name || supplier.displayName || 'M')?.charAt(0) }}
                 </div>
                 <div>
                    <h3 class="text-sm font-black text-[#0D1B2A]">{{ supplier.name || supplier.displayName || 'Sans Nom' }}</h3>
                    <div class="flex items-center gap-1.5 mt-1">
                       <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                       <span class="text-[9px] text-[#5a5e72] font-black uppercase tracking-widest">{{ supplier.status || 'Actif' }}</span>
                    </div>
                 </div>
              </div>
              
              <div class="space-y-3 mb-6">
                 <div class="flex items-center gap-2 text-[10px] text-[#5a5e72] font-semibold">
                    <mat-icon class="scale-50">email</mat-icon>
                    <span>{{ supplier.email || 'N/A' }}</span>
                 </div>
              </div>

              <div class="pt-6 border-t border-[#f0f2f5] flex items-center justify-between">
                 <div class="text-[10px] font-bold text-[#9699a8] uppercase tracking-widest">Type : <span class="text-[#0D1B2A]">Gros</span></div>
                 <div class="flex gap-2">
                    <button class="w-10 h-10 rounded-xl flex items-center justify-center text-[#9699a8] hover:bg-primary/10 hover:text-primary transition-all" title="Analytiques"><mat-icon class="scale-75">analytics</mat-icon></button>
                    <button class="w-10 h-10 rounded-xl flex items-center justify-center text-[#9699a8] hover:bg-primary/10 hover:text-primary transition-all" title="Paramètres"><mat-icon class="scale-75">settings</mat-icon></button>
                 </div>
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
export class AdminSuppliers {
  public dataService = inject(DataService);
}
