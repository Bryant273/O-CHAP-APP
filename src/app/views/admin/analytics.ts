import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in px-4 lg:px-0">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Analytiques Avancées</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Performance business et tendances de croissance O'CHAP</p>
        </div>
        <div class="flex gap-2">
           <button class="bg-white border border-[#e4e6ea] h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#5a5e72] hover:bg-[#f8f9fa] transition-all">7 Jours</button>
           <button class="bg-[#0D1B2A] text-white h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">30 Jours</button>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4"><mat-icon>monetization_on</mat-icon></div>
            <div class="text-2xl font-black text-[#0D1B2A] tracking-tighter font-price">{{formatAmount(totalRevenue())}} F</div>
            <div class="text-[9px] font-black text-[#9699a8] uppercase tracking-[0.2em] mt-1">Chiffre d'Affaires</div>
         </div>
         <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"><mat-icon>shopping_cart</mat-icon></div>
            <div class="text-2xl font-black text-[#0D1B2A] tracking-tighter">{{totalOrders()}}</div>
            <div class="text-[9px] font-black text-[#9699a8] uppercase tracking-[0.2em] mt-1">Commandes Totales</div>
         </div>
         <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><mat-icon>payments</mat-icon></div>
            <div class="text-2xl font-black text-[#0D1B2A] tracking-tighter font-price">{{formatAmount(avgOrderValue())}} F</div>
            <div class="text-[9px] font-black text-[#9699a8] uppercase tracking-[0.2em] mt-1">Panier Moyen</div>
         </div>
         <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm transform hover:-translate-y-1 transition-all duration-300">
            <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4"><mat-icon>trending_up</mat-icon></div>
            <div class="text-2xl font-black text-[#0D1B2A] tracking-tighter">+{{growthRate()}}%</div>
            <div class="text-[9px] font-black text-[#9699a8] uppercase tracking-[0.2em] mt-1">Croissance Heure</div>
         </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div class="bg-[#0D1B2A] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]"></div>
            <div class="relative z-10">
               <h3 class="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-10">Volume Transactionnel (Sync Live)</h3>
               <div class="h-[250px] flex items-end gap-3 px-4">
                  @for (v of volumes(); track $index) {
                     <div class="flex-1 bg-white/10 rounded-lg relative group transition-all hover:bg-primary/40" [style.height]="v + '%'">
                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[#0D1B2A] text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all shadow-xl pointer-events-none">
                           {{v}}%
                        </div>
                     </div>
                  }
               </div>
               <div class="flex justify-between mt-6 px-4">
                  @for (day of ['L', 'M', 'M', 'J', 'V', 'S', 'D']; track day) {
                     <span class="text-[10px] font-black text-white/30 uppercase tracking-widest">{{day}}</span>
                  }
               </div>
            </div>
         </div>

         <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm p-8 space-y-8">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-[#0D1B2A]">Performances Catégories</h3>
            <div class="space-y-6">
               @for (cat of categories(); track cat.name) {
                 <div class="space-y-2">
                    <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span class="text-[#0D1B2A]">{{cat.name}}</span>
                       <span class="text-primary">{{cat.val}}%</span>
                    </div>
                    <div class="h-2 bg-[#f0f2f5] rounded-full overflow-hidden">
                       <div class="h-full bg-primary transition-all duration-700 ease-out" [style.width]="cat.val + '%'"></div>
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
export class AdminAnalytics {
  public dataService = inject(DataService);

  totalRevenue = computed(() => this.dataService.orders$().reduce((acc, o) => acc + (o.totalAmount || 0), 0));
  totalOrders = computed(() => this.dataService.orders$().length);
  avgOrderValue = computed(() => this.totalOrders() > 0 ? this.totalRevenue() / this.totalOrders() : 0);
  growthRate = computed(() => 12.5); // Logic to compare with previous period could be added

  volumes = computed(() => [45, 62, 38, 85, 74, 92, 58]);
  categories = computed(() => [
    { name: 'Épicerie', val: 65 },
    { name: 'Électronique', val: 42 },
    { name: 'Maison', val: 28 },
    { name: 'Beauté', val: 15 }
  ]);

  formatAmount(val: number | unknown): string {
    return new Intl.NumberFormat('fr-FR').format(Math.round(Number(val) || 0));
  }
}
