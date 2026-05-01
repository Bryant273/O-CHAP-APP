import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-zones',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Livraisons & Zones</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Cartographie des hubs de distribution et périmètres logistiques</p>
        </div>
        <button class="bg-primary text-white h-11 px-6 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
          <mat-icon class="scale-75">add_location_alt</mat-icon> Nouvelle Zone
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div class="h-[500px] bg-white rounded-[2.5rem] border border-[#e4e6ea] flex items-center justify-center p-12 text-center relative overflow-hidden">
            <div class="absolute inset-0 bg-[#f8f9fa] opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/lonlat,12/400x400@2x?access_token=pk.placeholder')] bg-cover bg-center"></div>
            <div class="relative z-10 p-8 bg-white/80 backdrop-blur rounded-3xl border border-[#e4e6ea] shadow-2xl">
               <mat-icon class="scale-[1.8] text-primary mb-6">explore</mat-icon>
               <h3 class="text-xs font-black text-[#0D1B2A] uppercase tracking-widest">Géo-clôture Live</h3>
               <p class="text-[10px] text-[#5a5e72] font-black mt-4 uppercase tracking-[0.2em] leading-relaxed">Les zones sont synchronisées avec les hubs logistiques O'CHAP.</p>
            </div>
         </div>
         <div class="space-y-4">
            @if (dataService.zones$().length === 0) {
               <div class="p-20 text-center bg-white rounded-[2.5rem] border border-[#e4e6ea] border-dashed">
                  <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest italic">Aucune zone configurée</p>
               </div>
            }
            @for (zone of dataService.zones$(); track zone.id) {
              <div class="bg-white p-6 rounded-3xl border border-[#e4e6ea] shadow-sm flex items-center justify-between group hover:border-primary transition-all cursor-pointer">
                 <div class="flex items-center gap-5">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110"><mat-icon>layers</mat-icon></div>
                    <div>
                       <div class="text-sm font-black text-[#0D1B2A]">{{zone.name}}</div>
                       <div class="flex items-center gap-3 mt-1">
                          <span class="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">{{zone.status || 'Active'}}</span>
                          <span class="text-[9px] text-[#9699a8] font-bold uppercase tracking-widest italic font-price">{{formatAmount(zone.deliveryPrice)}} FCFA / Livraison</span>
                       </div>
                    </div>
                 </div>
                 <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button class="w-8 h-8 rounded-lg flex items-center justify-center text-[#9699a8] hover:bg-[#f8f9fa] hover:text-primary"><mat-icon class="scale-75">edit</mat-icon></button>
                    <button class="w-8 h-8 rounded-lg flex items-center justify-center text-[#9699a8] hover:bg-[#f8f9fa] hover:text-red-500"><mat-icon class="scale-75">delete</mat-icon></button>
                 </div>
              </div>
            }
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
export class AdminZones {
  public dataService = inject(DataService);

  formatAmount(val: number | unknown): string {
    return new Intl.NumberFormat('fr-FR').format(Number(val) || 0);
  }
}
