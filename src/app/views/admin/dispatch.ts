import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-dispatch',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in px-4 lg:px-0">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Dispatch Logistique</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Affectation et optimisation des tournées de livraison en temps réel O'CHAP</p>
        </div>
        <div class="flex gap-3">
           <button class="bg-[#f0f2f5] text-[#0D1B2A] h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#e4e6ea] transition-all flex items-center gap-2">
             <mat-icon class="scale-75 text-primary">history</mat-icon> Historique tournées
           </button>
           <button class="bg-primary text-white h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 hover:bg-primary-dark transition-all">
             <mat-icon class="scale-75">near_me</mat-icon> Lancer le dispatch auto
           </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[650px]">
         <!-- Live Map Placeholder -->
         <div class="lg:col-span-2 bg-white rounded-[3rem] border border-[#e4e6ea] shadow-2xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-[#f8f9fa] opacity-60 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/lonlat,12/800x600@2x?access_token=pk.placeholder')] bg-cover bg-center transition-transform duration-[10000ms] group-hover:scale-110"></div>
            
            <!-- Map Overlay UI -->
            <div class="absolute top-8 left-8 space-y-3">
               <div class="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-2xl border border-[#e4e6ea] flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <span class="text-[9px] font-black uppercase tracking-widest text-[#0D1B2A]">12 Livreurs actifs</span>
               </div>
               <div class="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-2xl border border-[#e4e6ea] flex items-center gap-3">
                  <mat-icon class="scale-50 text-primary">local_shipping</mat-icon>
                  <span class="text-[9px] font-black uppercase tracking-widest text-[#0D1B2A]">45 Livraisons en cours</span>
               </div>
            </div>

            <div class="absolute bottom-8 left-8 right-8 bg-[#0D1B2A]/90 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 text-white shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
               <div class="flex items-center justify-between">
                  <div>
                     <h3 class="text-sm font-black uppercase tracking-widest text-primary mb-1">Système de Géo-routing O'CHAP</h3>
                     <p class="text-[10px] text-white/40 font-bold italic">Visualisation dynamique des flux logistiques Abidjan / Dakar / Lomé</p>
                  </div>
                  <button class="bg-white text-[#0D1B2A] h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5">Agrandir la carte</button>
               </div>
            </div>
         </div>

         <!-- Delivery Partners List -->
         <div class="bg-[#0D1B2A] text-white rounded-[3rem] p-10 flex flex-col shadow-2xl">
            <div class="flex items-center justify-between mb-10">
               <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Livreurs / Hubs</h3>
               <span class="text-primary text-[10px] font-black tracking-widest uppercase bg-primary/10 px-2 py-1 rounded-lg">Online</span>
            </div>
            
            <div class="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
               @for (i of [1,2,3,4,5,6]; track i) {
                 <div class="p-4 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-between group hover:border-primary/50 hover:bg-white/10 transition-all cursor-pointer">
                    <div class="flex items-center gap-4">
                       <div class="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform">L{{i}}</div>
                       <div>
                          <div class="text-[11px] font-black text-white/90">Agent Logistic #OC{{100 + i}}</div>
                          <div class="flex items-center gap-2 mt-1">
                             <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                             <span class="text-[8px] text-white/40 font-bold uppercase tracking-widest">Zone {{['A','B','C'][i % 3]}}</span>
                          </div>
                       </div>
                    </div>
                    <mat-icon class="text-white/20 group-hover:text-primary transition-all scale-75">sensors</mat-icon>
                 </div>
               }
            </div>

            <div class="mt-8 pt-8 border-t border-white/10">
               <div class="text-[9px] text-white/30 font-black uppercase tracking-widest mb-4 italic">Statut global flotte</div>
               <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 w-[85%] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
               </div>
               <div class="flex justify-between mt-3">
                  <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">85% Disponibilité</span>
                  <span class="text-[9px] font-black text-white/20 uppercase tracking-widest">24/28 actifs</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }
  `]
})
export class AdminDispatch {
  public dataService = inject(DataService);
}
