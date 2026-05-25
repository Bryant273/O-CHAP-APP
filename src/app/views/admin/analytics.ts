import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-up px-6 lg:px-8 pb-20">
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
           <h2 class="text-2xl lg:text-3xl font-display font-semibold text-navy tracking-tight">Rapport de Performance</h2>
           <p class="text-xs text-muted mt-1 font-medium">Analyse temps-réel de l'écosystème commercial</p>
        </div>
        <div class="flex bg-surface-2 p-1 rounded-xl self-start">
           <button class="px-5 py-2 rounded-lg text-muted text-[9px] font-black uppercase tracking-widest hover:text-navy transition-all">7 Jours</button>
           <button class="px-5 py-2 rounded-lg bg-white shadow-sm text-navy text-[9px] font-black uppercase tracking-widest border border-surface-2">30 Jours</button>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <!-- Revenue -->
         <div class="bg-white p-6 rounded-xl border border-surface-2 shadow-sm hover:shadow-oc transition-all duration-300 group overflow-hidden relative">
            <div class="w-12 h-12 rounded-lg bg-primary/5 text-primary flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
               <mat-icon class="scale-90">payments</mat-icon>
            </div>
            <div class="relative z-10">
               <div class="text-2xl font-display font-bold text-navy tracking-tight mb-0.5">{{formatAmount(totalRevenue())}} <small class="text-[10px] opacity-30">F</small></div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-[0.15em] opacity-60">Chiffre d'Affaires</div>
            </div>
         </div>

         <!-- Orders -->
         <div class="bg-white p-6 rounded-xl border border-surface-2 shadow-sm hover:shadow-oc transition-all duration-300 group overflow-hidden relative">
            <div class="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
               <mat-icon class="scale-90">shopping_bag</mat-icon>
            </div>
            <div class="relative z-10">
               <div class="text-2xl font-display font-bold text-navy tracking-tight mb-0.5">{{totalOrders()}}</div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-[0.15em] opacity-60">Commandes Totales</div>
            </div>
         </div>

         <!-- AOV -->
         <div class="bg-white p-6 rounded-xl border border-surface-2 shadow-sm hover:shadow-oc transition-all duration-300 group overflow-hidden relative">
            <div class="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
               <mat-icon class="scale-90">local_mall</mat-icon>
            </div>
            <div class="relative z-10">
               <div class="text-2xl font-display font-bold text-navy tracking-tight mb-0.5">{{formatAmount(avgOrderValue())}} <small class="text-[10px] opacity-30">F</small></div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-[0.15em] opacity-60">Panier Moyen</div>
            </div>
         </div>

         <!-- Growth -->
         <div class="bg-white p-6 rounded-xl border border-surface-2 shadow-sm hover:shadow-oc transition-all duration-300 group overflow-hidden relative">
            <div class="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-8 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
               <mat-icon class="scale-90">trending_up</mat-icon>
            </div>
            <div class="relative z-10">
               <div class="text-2xl font-display font-bold text-navy tracking-tight mb-0.5">+{{growthRate()}}%</div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-[0.15em] opacity-60">Indice de Croissance</div>
            </div>
         </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div class="bg-navy rounded-xl p-10 text-white relative overflow-hidden shadow-xl group">
            <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000"></div>
            
            <div class="relative z-10">
               <div class="flex items-center justify-between mb-12">
                  <div>
                    <h3 class="text-lg font-display font-bold tracking-tight">Flux Transactionnel.</h3>
                    <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">VOLUME DE VENTE SUR 7 JOURS</p>
                  </div>
                  <mat-icon class="text-primary scale-90 opacity-40">auto_graph</mat-icon>
               </div>

               <div class="h-[240px] flex items-end gap-4 px-4 mb-6">
                  @for (v of volumes(); track $index) {
                     <div class="flex-1 flex flex-col items-center gap-5 group/bar">
                        <div class="w-full relative h-[200px] flex flex-col justify-end">
                           <div [style.height.%]="v" 
                                class="w-full bg-white/5 rounded-lg transition-all duration-500 cursor-pointer relative overflow-hidden group-hover/bar:bg-white/10">
                              
                              <div class="absolute inset-x-0 bottom-0 bg-primary opacity-40 transition-all duration-700 rounded-lg"
                                   [style.height.%]="80"
                                   [class.opacity-100]="$index === 5"></div>
                           </div>
                        </div>
                        <span class="text-[9px] font-black text-white/20 uppercase tracking-widest">{{['L', 'M', 'M', 'J', 'V', 'S', 'D'][$index]}}</span>
                     </div>
                  }
               </div>
            </div>
         </div>

         <div class="bg-white rounded-xl border border-surface-2 shadow-oc p-10 space-y-10 relative overflow-hidden group">
            <div class="flex items-center justify-between mb-2">
               <div>
                 <h3 class="text-lg font-display font-bold text-navy tracking-tight">Part de Marché.</h3>
                 <p class="text-[9px] font-black uppercase tracking-[0.15em] text-muted mt-1 opacity-60">PAR CATÉGORIE</p>
               </div>
               <mat-icon class="text-navy opacity-20">pie_chart</mat-icon>
            </div>
            
            <div class="space-y-6 relative z-10">
               @for (cat of categories(); track cat.name) {
                 <div class="space-y-3">
                    <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.15em]">
                       <span class="text-navy opacity-60">{{cat.name}}</span>
                       <span class="text-primary">{{cat.val}}%</span>
                    </div>
                    <div class="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                       <div class="h-full bg-primary transition-all duration-1000 ease-out rounded-full" [style.width.%]="cat.val"></div>
                    </div>
                 </div>
               }
            </div>

            <div class="mt-10 p-8 rounded-2xl bg-dark text-white relative z-10 shadow-2xl overflow-hidden group/ai">
               <!-- Gradient background -->
               <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50"></div>
               
               <div class="relative z-10">
                  <div class="flex items-center justify-between mb-8">
                     <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center animate-pulse">
                           <mat-icon class="scale-75">smart_toy</mat-icon>
                        </div>
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intelligence Artificielle O'CHAP</div>
                     </div>
                     <button (click)="refreshAIInsights()" 
                             [disabled]="isAIUpdating()"
                             class="h-8 px-4 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-30">
                        {{ isAIUpdating() ? 'ANALYSE...' : 'RAFRAÎCHIR' }}
                     </button>
                  </div>

                  @if (aiReport(); as report) {
                     <div class="space-y-6 animate-fade-in">
                        <div class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                           <div class="w-2 h-2 rounded-full" [class.bg-emerald-500]="report.globalHealth === 'excellent'" [class.bg-amber-500]="report.globalHealth === 'stable'" [class.bg-red-500]="report.globalHealth === 'critical'"></div>
                           <p class="text-xs font-black uppercase tracking-widest leading-none">Santé : {{ report.globalHealth }}</p>
                        </div>
                        
                        <p class="text-[13px] font-medium text-white/70 leading-relaxed italic border-l-2 border-primary/40 pl-6">
                           "{{ report.profitAnalysis }}"
                        </p>

                        <div class="grid grid-cols-2 gap-4">
                           <div class="space-y-2">
                              <p class="text-[9px] font-black uppercase tracking-widest text-white/30">Opportunités Saisonnières</p>
                              <p class="text-[11px] font-bold text-white/80 leading-snug">{{ report.seasonalInsights }}</p>
                           </div>
                           <div class="space-y-2">
                              <p class="text-[9px] font-black uppercase tracking-widest text-white/30">Top Marques</p>
                              <div class="flex flex-wrap gap-2">
                                 @for (brand of report.topPerformingBrands; track brand) {
                                    <span class="px-2 py-0.5 rounded bg-white/10 text-[9px] font-black">{{ brand }}</span>
                                 }
                              </div>
                           </div>
                        </div>
                     </div>
                  } @else {
                     <div class="py-10 text-center opacity-40">
                        <p class="text-xs font-black uppercase tracking-widest">Lancez une analyse pour obtenir des insights prédictifs.</p>
                     </div>
                  }
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
  `]
})
export class AdminAnalytics {
  public dataService = inject(DataService);

  aiReport = signal<AIAnalyticsReport | null>(null);
  isAIUpdating = signal(false);

  async refreshAIInsights() {
    this.isAIUpdating.set(true);
    const report = await this.dataService.getAdvancedAnalytics() as AIAnalyticsReport;
    this.aiReport.set(report);
    this.isAIUpdating.set(false);
  }

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
    return this.dataService.formatAmount(val);
  }
}

interface AIAnalyticsReport {
  globalHealth: string;
  profitAnalysis: string;
  seasonalInsights: string;
  topPerformingBrands: string[];
}
