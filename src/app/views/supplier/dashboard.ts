import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { DataService, OchapOrder, OchapProduct } from '../../services/data.service';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10 animate-fade-up pb-20 px-6">
      
      <!-- PERFORMANCE BANNER -->
      <div class="relative overflow-hidden bg-navy rounded-2xl p-10 text-white shadow-xl shadow-navy/10 group">
         <div class="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
            <mat-icon class="scale-[6] opacity-10 rotate-12">auto_graph</mat-icon>
         </div>
         
         <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div class="space-y-4">
               <div class="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <span class="text-[9px] font-black uppercase tracking-[0.2em]">PARTENAIRE CERTIFIÉ</span>
               </div>
               <h2 class="text-3xl lg:text-4xl font-display font-semibold tracking-tight leading-tight">
                 Bonjour, {{ supplierName() }}. <br>
                 <span class="text-primary opacity-90">{{ dynamicSubtitle() }}</span>
               </h2>
               <p class="text-white/30 text-xs font-medium tracking-wide">{{ currentDate() }}</p>
            </div>
            
            <div class="flex flex-wrap gap-4 lg:gap-6">
               <div class="min-w-[120px] p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-center items-center text-center group-hover:bg-white/10 transition-colors">
                  <span class="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Score Qualité</span>
                  <div class="flex items-center gap-2">
                     <span class="text-3xl font-display font-bold">{{ averageRating() }}</span>
                     <mat-icon class="text-primary scale-75">stars</mat-icon>
                  </div>
               </div>
               <div class="min-w-[120px] p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-center items-center text-center group-hover:bg-white/10 transition-colors">
                    <span class="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Commandes</span>
                    <span class="text-3xl font-display font-bold">{{ totalOrdersCount() }}</span>
               </div>
            </div>
         </div>
      </div>

      <!-- ANALYTICS CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white p-6 rounded-xl border border-surface-2 hover:shadow-oc transition-all duration-300 group relative overflow-hidden flex flex-col">
            <div class="flex justify-between items-start mb-6 relative z-10">
               <div [class]="stat.iconBg" class="w-11 h-11 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all duration-500 shadow-sm shadow-black/5">
                 <mat-icon [class]="stat.iconColor" class="scale-75">{{ stat.icon }}</mat-icon>
               </div>
               <div [class]="stat.trendClass" class="text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-current opacity-80 backdrop-blur-md">
                  {{ stat.trend }}
               </div>
            </div>
            <div class="mt-auto relative z-10">
               <h3 class="text-2xl font-display font-bold text-navy tracking-tight mb-0.5">{{ stat.value }}</h3>
               <p class="text-[9px] font-bold text-muted uppercase tracking-[0.1em] opacity-60">{{ stat.label }}</p>
            </div>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Revenue Insights (Left 2 cols) -->
        <div class="lg:col-span-2 bg-white p-10 rounded-2xl border border-surface-2 shadow-oc overflow-hidden relative group">
           <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
              <div>
                 <h4 class="text-lg font-display font-bold text-navy tracking-tight">Volume d'Affaire.</h4>
                 <p class="text-[9px] font-black text-muted uppercase tracking-[0.15em] mt-1 opacity-60">Analyse hebdomadaire</p>
              </div>
              <div class="flex bg-surface-2 p-1 rounded-xl gap-1">
                 <button class="px-5 py-2 rounded-lg bg-white shadow-sm text-navy text-[9px] font-black uppercase tracking-widest">7 Jours</button>
                 <button class="px-5 py-2 rounded-lg text-muted text-[9px] font-black uppercase tracking-widest hover:text-navy transition-all">30 Jours</button>
              </div>
           </div>
           
           <div class="flex items-end gap-5 h-64 px-4 relative z-10">
              @for (val of weeklyRevenue(); track $index) {
                <div class="flex-1 flex flex-col items-center gap-5 group/bar">
                   <div class="w-full relative h-full flex flex-col justify-end">
                      <div [style.height.%]="(val / maxWeeklyRevenue()) * 100" 
                           class="w-full bg-surface-2 rounded-lg transition-all duration-700 ease-out cursor-pointer relative overflow-hidden group-hover/bar:bg-primary/5">
                        
                         <!-- Active/Filled Part -->
                         <div class="absolute inset-x-0 bottom-0 bg-primary opacity-10 group-hover/bar:opacity-30 transition-all rounded-lg" [style.height.%]="100"></div>
                         <div class="absolute inset-x-0 bottom-0 bg-primary rounded-lg transition-all duration-1000 shadow-sm"
                              [style.height.%]="40"
                              [class.opacity-100]="$last"></div>
                      </div>

                      <!-- Tooltip -->
                      <div class="absolute -top-14 left-1/2 -translate-x-1/2 bg-navy text-white px-3 py-2 rounded-xl text-[10px] font-black opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 shadow-xl z-20 pointer-events-none flex flex-col items-center">
                         {{val | number:'1.0-0'}}K <small class="text-[7px] opacity-60 ml-0.5 font-sans">CFA</small>
                      </div>
                   </div>
                   <span class="text-[9px] font-black text-muted uppercase tracking-widest group-hover/bar:text-primary transition-colors">{{ getDayLabel($index) }}</span>
                </div>
              }
           </div>
        </div>

        <!-- Inventory Alerts -->
        <div class="bg-navy p-10 rounded-2xl text-white border border-white/5 shadow-xl relative overflow-hidden group">
           <div class="mb-10 relative z-10">
              <h4 class="text-lg font-display font-bold tracking-tight">Santé Logistique.</h4>
              <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] mt-1">Niveaux critiques</p>
           </div>
           
           <div class="space-y-6 relative z-10">
              @for (cat of categories(); track cat.label) {
                 <div class="space-y-3">
                    <div class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                       <span class="text-white/40">{{ cat.label }}</span>
                       <span [style.color]="cat.color" class="text-[11px]">{{ cat.value }}%</span>
                    </div>
                    <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <div class="h-full rounded-full transition-all duration-1000 ease-out" 
                            [style.width.%]="cat.value" 
                            [style.background-color]="cat.color"></div>
                    </div>
                 </div>
              }
           </div>

           <div class="mt-12 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3 relative z-10">
              <div class="flex items-center gap-2">
                 <mat-icon class="scale-75 text-primary">lightbulb</mat-icon>
                 <div class="text-[9px] font-black text-primary uppercase tracking-widest">O'CHAP INSIGHT</div>
              </div>
              <p class="text-[12px] font-medium text-white/60 leading-relaxed italic">"Réapprovisionnement recommandé sur les Réfrigérateurs avant le weekend."</p>
           </div>
        </div>
      </div>

      <!-- DETAILED STATISTICS & PRODUCT PERFORMANCE CHART (Recharts Style) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 animate-fade-up">
         <!-- Bar Chart (Left 2 cols) -->
         <div class="lg:col-span-2 bg-white p-10 rounded-2xl border border-surface-2 shadow-oc overflow-hidden relative group">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
               <div>
                  <h4 class="text-lg font-display font-bold text-navy tracking-tight">Analyse des Ventes Produits.</h4>
                  <p class="text-[9px] font-black text-muted uppercase tracking-[0.15em] mt-1 opacity-60">Articles les plus vendus en volume (style Recharts)</p>
               </div>
               
               <!-- Chart Legends -->
               <div class="flex items-center gap-6">
                  <div class="flex items-center gap-2">
                     <span class="w-3 h-3 rounded bg-gradient-to-t from-primary to-[#FF8142]"></span>
                     <span class="text-[9px] font-black uppercase tracking-widest text-[#0D1B2A]/70">Unités Vendues</span>
                  </div>
               </div>
            </div>

            <!-- Chart Canvas -->
            <div class="relative h-64 w-full flex items-end">
               <!-- Y-Axis Tick Labels (Right-aligned to left of chart) -->
               <div class="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[8px] font-mono font-bold text-muted pointer-events-none text-right pr-3 border-r border-surface-2/60 z-10">
                  <span>{{ maxProductSales() }}u</span>
                  <span>{{ Math.round(maxProductSales() * 0.75) }}u</span>
                  <span>{{ Math.round(maxProductSales() * 0.5) }}u</span>
                  <span>{{ Math.round(maxProductSales() * 0.25) }}u</span>
                  <span>0u</span>
               </div>

               <!-- Horizontal Chart Grid Lines -->
               <div class="absolute left-12 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none border-r border-[#e4e6ea]/60">
                  <div class="border-b border-surface-2/60 w-full h-0"></div>
                  <div class="border-b border-surface-2/60 w-full h-0"></div>
                  <div class="border-b border-surface-2/60 w-full h-0"></div>
                  <div class="border-b border-surface-2/60 w-full h-0"></div>
                  <div class="border-b border-navy/15 w-full h-0"></div>
               </div>

               <!-- Chart Columns container -->
               <div class="absolute left-12 right-0 top-0 bottom-8 flex items-end justify-around px-4">
                  @for (item of bestSellingProducts(); track item.name; let i = $index) {
                     <div class="flex-1 flex flex-col items-center justify-end h-full relative group/chartcol cursor-pointer max-w-[80px]">
                        
                        <!-- Premium Interactive Tooltip mimicking Recharts -->
                        <div class="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/chartcol:opacity-100 transition-all duration-300 transform scale-75 group-hover/chartcol:scale-100 bg-[#060D17] text-white p-4 rounded-2xl shadow-2xl border border-white/15 z-50 w-52 pointer-events-none text-left flex flex-col gap-2">
                           <div>
                              <p class="text-[8px] font-black uppercase tracking-widest text-primary">{{ item.category }}</p>
                              <p class="text-[11px] font-black text-white truncate leading-tight mt-0.5">{{ item.name }}</p>
                           </div>
                           <div class="border-t border-white/10 pt-2 flex flex-col gap-1.5">
                              <div class="flex justify-between items-center text-[9px] font-bold text-white/60">
                                 <span>Volume vendu :</span>
                                 <span class="font-black text-white">{{ item.quantity }} unités</span>
                              </div>
                              <div class="flex justify-between items-center text-[9px] font-bold text-white/60">
                                 <span>Valeur Ventes :</span>
                                 <span class="font-black text-primary font-price">{{ formatPrice(item.revenue) }}</span>
                              </div>
                           </div>
                        </div>

                        <!-- Bar Graphics -->
                        <div class="w-10 bg-surface-2 hover:bg-surface-3 transition-colors rounded-t-xl h-full flex items-end relative overflow-hidden shadow-sm">
                           <!-- Dynamic Animating Bar Fill -->
                           <div class="w-full bg-gradient-to-t from-[#FF5200] to-[#FF8142] group-hover/chartcol:from-[#e04800] group-hover/chartcol:to-[#FF6C24] transition-all rounded-t-xl absolute bottom-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]"
                                [style.height.%]="(item.quantity / maxProductSales()) * 100">
                              <!-- Gloss reflective line -->
                              <div class="absolute inset-y-0 left-0 w-2.5 bg-white/15"></div>
                           </div>
                        </div>
                     </div>
                  }
               </div>

               <!-- X-Axis Labels Row -->
               <div class="absolute left-12 right-0 bottom-0 h-6 flex justify-around items-center border-t border-navy/15 pt-2 px-4">
                  @for (item of bestSellingProducts(); track item.name) {
                     <span class="text-[8px] font-black text-muted uppercase tracking-widest truncate w-20 text-center" [title]="item.name">
                        {{ item.name }}
                     </span>
                  }
               </div>
            </div>
         </div>

         <!-- Leaderboard Panel (Right 1 col) -->
         <div class="bg-navy p-10 rounded-2xl text-white border border-white/5 shadow-xl relative overflow-hidden group">
            <div class="mb-8 relative z-10">
               <h4 class="text-lg font-display font-bold tracking-tight">Classement.</h4>
               <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] mt-1">Palmarès des ventes d'articles</p>
            </div>

            <div class="space-y-4 relative z-10">
               @for (item of bestSellingProducts(); track item.name; let i = $index) {
                  @if (i < 3) {
                     <div class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group/leader select-none">
                        <div class="flex items-center gap-4">
                           <!-- Ranking Badge -->
                           <div [class]="i === 0 ? 'bg-[#FFD700] text-navy' : i === 1 ? 'bg-[#C0C0C0] text-navy' : 'bg-[#CD7F32] text-white'"
                                class="w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shadow-lg">
                              {{ i + 1 }}
                           </div>
                           <div class="min-w-0">
                              <p class="text-[11px] font-bold text-white uppercase truncate w-32 group-hover/leader:text-primary transition-colors">{{ item.name }}</p>
                              <p class="text-[8px] font-black text-white/40 uppercase tracking-wider mt-0.5">{{ item.category }}</p>
                           </div>
                        </div>
                        <div class="text-right">
                           <p class="text-xs font-black text-white font-price">{{ item.quantity }}u</p>
                           <p class="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-0.5">{{ formatPrice(item.revenue) }}</p>
                        </div>
                     </div>
                  }
               } @empty {
                  <div class="py-12 flex flex-col items-center justify-center text-center opacity-30">
                     <mat-icon class="scale-125 mb-3">military_tech</mat-icon>
                     <p class="text-[9px] font-black uppercase tracking-widest">Aucune vente enregistrée</p>
                  </div>
               }
            </div>
         </div>
      </div>

      <!-- QUICK INVENTORY MANAGEMENT -->
      <div class="bg-white rounded-xl border border-surface-2 shadow-sm overflow-hidden mt-8">
        <div class="px-8 py-6 border-b border-surface-2 flex items-center justify-between">
           <div>
             <h3 class="text-lg font-display font-bold text-navy tracking-tight">Gestion du <span class="text-primary">Stock.</span></h3>
             <p class="text-[9px] font-bold text-muted uppercase tracking-widest mt-1 opacity-60">Mise à jour rapide</p>
           </div>
           <div class="flex items-center gap-2">
              <span class="text-[8px] font-black uppercase text-muted tracking-widest">En ligne</span>
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           </div>
        </div>
        
        <div class="overflow-x-auto no-scrollbar">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-surface-1">
                <th class="px-8 py-4 text-left text-[9px] font-black text-muted uppercase tracking-widest">Produit</th>
                <th class="px-8 py-4 text-left text-[9px] font-black text-muted uppercase tracking-widest">Prix</th>
                <th class="px-8 py-4 text-center text-[9px] font-black text-muted uppercase tracking-widest">Stock</th>
                <th class="px-8 py-4 text-right text-[9px] font-black text-muted uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-2">
              @for (p of myProducts(); track p.id) {
                <tr class="hover:bg-surface-1 group transition-all">
                  <td class="px-8 py-4">
                    <div class="flex items-center gap-3">
                       <div class="w-10 h-10 rounded-lg bg-surface-2 border border-surface-2 overflow-hidden group-hover:scale-105 transition-transform">
                          <img [src]="p.imageUrl || 'https://picsum.photos/seed/'+p.id+'/200'" class="w-full h-full object-cover" referrerpolicy="no-referrer" [alt]="p.name">
                       </div>
                       <div class="flex flex-col">
                          <span class="text-[11px] font-bold text-navy">{{ p.name }}</span>
                          <span class="text-[8px] font-bold text-muted uppercase tracking-widest">{{ p.category }}</span>
                       </div>
                    </div>
                  </td>
                  <td class="px-8 py-4">
                     <span class="text-[11px] font-bold text-navy font-price tracking-tight">{{ formatPrice(p.price) }} <small class="text-[7px] opacity-40">FCFA</small></span>
                  </td>
                  <td class="px-8 py-4 text-center">
                     <div class="flex flex-col items-center gap-1.5">
                        <span [class]="p.stock > 10 ? 'text-[#00925c]' : 'text-[#FF6200]'" class="text-[11px] font-bold font-price">{{ p.stock }}</span>
                        <div class="w-16 h-1 bg-surface-2 rounded-full overflow-hidden">
                           <div class="h-full rounded-full transition-all duration-500" 
                                [style.width.%]="(p.stock / 100) * 100 > 100 ? 100 : (p.stock / 100) * 100"
                                [style.background-color]="p.stock > 10 ? '#00925c' : '#FF6200'"></div>
                        </div>
                     </div>
                  </td>
                  <td class="px-8 py-4 text-right">
                     <button (click)="openStockModal(p)" class="px-3 py-1.5 bg-navy text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-sm">Éditer</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- STOCK MODAL -->
      @if (selectedProduct(); as p) {
         <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
            <div class="absolute inset-0 bg-[#0D1B2A]/80 backdrop-blur-md" 
                 (click)="selectedProduct.set(null)"
                 role="button"
                 aria-label="Fermer l'édition"
                 tabindex="0"
                 (keydown.enter)="selectedProduct.set(null)"></div>
            <div class="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl animate-fade-in border border-[#e4e6ea]">
               <button (click)="selectedProduct.set(null)" class="absolute top-8 right-8 text-muted hover:text-dark">
                  <mat-icon>close</mat-icon>
               </button>
               
               <div class="mb-10">
                  <h3 class="text-2xl font-black text-dark tracking-tighter mb-2 italic">Ajuster le <span class="text-primary">Stock.</span></h3>
                  <p class="text-xs text-muted font-medium">Modification immédiate pour : <span class="text-dark font-black">{{ p.name }}</span></p>
               </div>
               
               <div class="grid grid-cols-2 gap-8 mb-10">
                  <div class="p-6 rounded-3xl bg-[#f8f9fa] border border-[#e4e6ea]">
                     <span class="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">Stock Actuel</span>
                     <span class="text-3xl font-black text-dark font-price">{{ p.stock }}</span>
                  </div>
                  <div class="p-6 rounded-3xl bg-[#f8f9fa] border border-[#e4e6ea]">
                     <span class="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">Seuil Alerte</span>
                     <span class="text-3xl font-black text-dark font-price">{{ p.threshold || 10 }}</span>
                  </div>
               </div>
               <div class="space-y-6">
                  <div>
                     <label for="stock-input" class="text-[10px] font-black text-dark uppercase tracking-widest block mb-4">Nouvelle Quantité</label>
                     <div class="flex items-center gap-4">
                        <button (click)="decrementStock()" class="w-14 h-14 rounded-2xl bg-[#0D1B2A] text-white flex items-center justify-center hover:bg-primary transition-all">
                           <mat-icon>remove</mat-icon>
                        </button>
                        <input id="stock-input" type="number" [(ngModel)]="newStockValue" 
                               class="flex-1 h-14 bg-[#f8f9fa] border-2 border-[#e4e6ea] rounded-2xl text-center text-xl font-black font-price focus:border-primary focus:outline-none">
                        <button (click)="incrementStock()" class="w-14 h-14 rounded-2xl bg-[#0D1B2A] text-white flex items-center justify-center hover:bg-primary transition-all">
                           <mat-icon>add</mat-icon>
                        </button>
                     </div>
                  </div>
               </div>
                  
                  <button (click)="saveStock()" [disabled]="isSaving()" class="w-full h-16 bg-[#FF6200] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                     @if (isSaving()) {
                        <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     } @else {
                        <mat-icon class="scale-90">save</mat-icon>
                        Confirmer la mise à jour
                     }
                  </button>
               </div>
            </div>
      }

      <!-- RECENT OPERATIONS -->
      <div class="bg-white rounded-xl border border-surface-2 shadow-sm overflow-hidden mb-12">
        <div class="px-8 py-6 border-b border-surface-2 flex items-center justify-between">
           <div>
             <h4 class="text-lg font-display font-bold text-navy tracking-tight">Flux des Commandes</h4>
             <p class="text-[9px] font-bold text-muted uppercase tracking-widest mt-1 opacity-60">Dernières interactions</p>
           </div>
           <button routerLink="/supplier/orders" class="px-4 py-2 rounded-lg border border-surface-2 text-[9px] font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all">Voir Historique</button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-surface-1 border-b border-surface-2">
                <th class="px-8 py-4 text-left text-[9px] font-black text-muted uppercase tracking-widest">Transaction</th>
                <th class="px-8 py-4 text-left text-[9px] font-black text-muted uppercase tracking-widest">Client</th>
                <th class="px-8 py-4 text-right text-[9px] font-black text-muted uppercase tracking-widest">Valeur</th>
                <th class="px-8 py-4 text-center text-[9px] font-black text-muted uppercase tracking-widest">Statut</th>
                <th class="px-8 py-4 text-center text-[9px] font-black text-muted uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-2">
              @for (order of recentOrders(); track order['id']) {
                <tr class="hover:bg-surface-1 group transition-all">
                  <td class="px-8 py-4">
                    <span class="text-[10px] font-mono font-bold text-navy">#{{ asString(order['id']).slice(-6).toUpperCase() }}</span>
                  </td>
                  <td class="px-8 py-4">
                    <div class="flex flex-col">
                      <span class="text-[11px] font-bold text-navy">{{ order['customerName'] || 'Particulier O\\'CHAP' }}</span>
                      <span class="text-[8px] font-medium text-muted uppercase opacity-60">{{ order['date'] || 'Aujourd\\'hui' }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-4 text-right">
                    <span class="text-[11px] font-bold text-primary font-price">{{ formatPrice(order['total']) }} <small class="text-[7px]">FCFA</small></span>
                  </td>
                  <td class="px-8 py-4">
                    <div class="flex justify-center">
                       <span [class]="getStatusClass(asString(order['status']))" class="text-[8px] font-bold px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-all border border-current">
                         <mat-icon class="scale-[0.5]">{{ getStatusIcon(asString(order['status'])) }}</mat-icon>
                         {{ getStatusLabel(asString(order['status'])) }}
                       </span>
                    </div>
                  </td>
                  <td class="px-8 py-4">
                    <div class="flex justify-center">
                      <button [routerLink]="['/supplier/orders', order['id']]" class="w-8 h-8 rounded-lg bg-white border border-surface-2 text-navy hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm flex items-center justify-center">
                        <mat-icon class="scale-50">launch</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-24 text-center">
                    <div class="flex flex-col items-center gap-4 opacity-20">
                       <mat-icon class="scale-150">receipt_long</mat-icon>
                       <p class="text-[9px] font-black uppercase tracking-widest">En attente de commandes</p>
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
    .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `]
})
export class SupplierDashboard implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private dataService = inject(DataService);
  private unsubscribeFunctions: (() => void)[] = [];
  
  constructor() {
    // Subscribe to auth changes to initialize watchers
    toObservable(this.authService.user$).subscribe(user => {
      // Clear previous watchers
      this.clearWatchers();
      
      if (user) {
        this.loadSupplierData(user.uid);
      }
    });
  }
  
  supplierName = computed(() => {
    const profile = this.authService.profile$() as Record<string, unknown>;
    return (profile?.['businessName'] as string) || (profile?.['displayName'] as string) || (this.authService.user$()?.email?.split('@')[0]) || 'Boutique O\'CHAP';
  });
  currentDate = signal('');
  Math = Math;
  
  // Inventory state
  myProducts = computed(() => this.dataService.products$() as OchapProduct[]);
  selectedProduct = signal<OchapProduct | null>(null);
  newStock = signal<number>(0);
  isSaving = signal(false);

  bestSellingProducts = computed(() => {
    const orders = this.dataService.orders$() as OchapOrder[];
    const products = this.dataService.products$() as OchapProduct[];
    
    // Group sales by product id/name
    const salesMap: Record<string, { name: string, quantity: number, revenue: number, category: string }> = {};
    
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      o.items?.forEach(item => {
         if (!salesMap[item.id]) {
            salesMap[item.id] = {
               name: item.name,
               quantity: 0,
               revenue: 0,
               category: item.category || 'Autres'
            };
         }
         salesMap[item.id].quantity += Number(item.quantity) || 0;
         salesMap[item.id].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      });
    });

    const sortedSales = Object.values(salesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    if (sortedSales.length === 0) {
      // Create mockup data representing top products from their catalog to make the chart lively
      return products.slice(0, 5).map((p, idx) => ({
         name: p.name,
         quantity: 25 - idx * 4,
         revenue: (p.price || 150000) * (25 - idx * 4),
         category: p.category
      }));
    }

    return sortedSales;
  });

  maxProductSales = computed(() => {
    const list = this.bestSellingProducts();
    const maxVal = Math.max(...list.map(item => item.quantity), 10);
    return Math.ceil(maxVal / 5) * 5;
  });

  get newStockValue(): number { return this.newStock(); }
  set newStockValue(v: number) { this.newStock.set(v); }

  dynamicSubtitle = computed(() => {
    const orders = this.dataService.orders$() as OchapOrder[];
    const shop = this.supplierName();
    const pending = orders.filter(o => o.status === 'pending').length;
    
    if (pending > 0) return `${pending} nouvelles commandes à traiter pour ${shop}.`;
    
    const revenue = orders.filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    
    if (revenue > 1000000) return `Performances exceptionnelles sur ${shop} !`;
    if (revenue > 0) return `Vos ventes sont synchronisées pour ${shop}`;
    
    return `Votre boutique ${shop} est connectée au réseau O'CHAP`;
  });
  
  // DYNAMIC STATS BASED ON REAL DATA
  stats = computed(() => {
    const orders = this.dataService.orders$() as OchapOrder[];
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const activeDeliveries = orders.filter(o => o.status === 'shipped').length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    return [
      { 
        label: 'Commandes totales', 
        value: totalOrders.toString(), 
        icon: 'shopping_bag', 
        iconBg: 'bg-[#fff3ec]', 
        iconColor: 'text-[#FF6200]', 
        trend: 'Volume', 
        trendClass: 'bg-[#eafaf1] text-[#00925c]' 
      },
      { 
        label: 'En attente', 
        value: pendingOrders.toString(), 
        icon: 'schedule', 
        iconBg: 'bg-[#e8f4fd]', 
        iconColor: 'text-[#0984e3]', 
        trend: pendingOrders > 0 ? 'Urgent' : 'À jour', 
        trendClass: pendingOrders > 0 ? 'bg-[#fef9e6] text-[#f39c12]' : 'bg-[#eafaf1] text-[#00925c]' 
      },
      { 
        label: 'Livraisons actives', 
        value: activeDeliveries.toString(), 
        icon: 'local_shipping', 
        iconBg: 'bg-[#e8fdf5]', 
        iconColor: 'text-[#00b894]', 
        trend: 'Transition', 
        trendClass: 'bg-[#f0f2f5] text-[#5a5e72]' 
      },
        { 
          label: "Chiffre d'affaires", 
          value: this.formatPrice(totalRevenue), 
          icon: 'payments', 
          iconBg: 'bg-[#fef9e6]', 
          iconColor: 'text-[#f39c12]', 
          trend: 'Revenus', 
          trendClass: 'bg-[#eafaf1] text-[#00925c]' 
        }
    ];
  });

  categories = computed(() => {
    const products = this.dataService.products$();
    if (products.length === 0) return [
      { label: 'Aucun produit', value: 0, color: '#e4e6ea' }
    ];

    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Autres';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = ['#FF6200', '#0984e3', '#00b894', '#f39c12', '#6c5ce7'];
    return Object.entries(counts).map(([label, count], i) => ({
      label,
      value: Math.round((count / products.length) * 100),
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value).slice(0, 4);
  });

  totalOrdersCount = computed(() => this.dataService.orders$().length);
  averageRating = computed(() => {
    const products = this.dataService.products$();
    const rated = products.filter(p => (p.rating || 0) > 0);
    if (rated.length === 0) return 5.0;
    const sum = rated.reduce((acc, p) => acc + (p.rating || 0), 0);
    return (sum / rated.length).toFixed(1);
  });

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
      return dayTotal / 1000; // In K CFA
    });
  });

  maxWeeklyRevenue = computed(() => Math.max(...this.weeklyRevenue(), 100));

  ngOnInit() {
    const d = new Date();
    this.currentDate.set(d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }

  private clearWatchers() {
    this.unsubscribeFunctions.forEach(unsub => unsub());
    this.unsubscribeFunctions = [];
  }

  loadSupplierData(uid: string) {
    // Basic watchers - push to array for cleanup
    this.unsubscribeFunctions.push(this.dataService.watchSupplierOrders(uid));
    this.unsubscribeFunctions.push(this.dataService.watchSupplierProducts(uid));
    
    // Monitoring - NOTE: watchNotifications is already handled by Layout,
    // but if we want it here too, we must store the unsub.
    // However, to avoid double subscriptions and permissions noise on logout,
    // let's just rely on the Layout for global notifications signal.
    // If we DO need to call it here, we store it:
    // this.unsubscribeFunctions.push(this.dataService.watchNotifications(uid));
    
    this.dataService.monitorStockLevels();
  }

  ngOnDestroy() {
    this.clearWatchers();
  }

  // Effect computed for recent orders
  recentOrders = computed(() => {
    return (this.dataService.orders$() as OchapOrder[]).slice(0, 5);
  });

  decrementStock() {
    this.newStock.update(v => Math.max(0, v - 1));
  }

  incrementStock() {
    this.newStock.update(v => v + 1);
  }

  openStockModal(product: OchapProduct) {
    this.selectedProduct.set(product);
    this.newStock.set(product.stock || 0);
  }

  async saveStock() {
    const prod = this.selectedProduct();
    if (!prod) return;

    this.isSaving.set(true);
    try {
      await this.dataService.updateStock(prod.id, this.newStock());
      this.selectedProduct.set(null);
    } catch (e) {
      console.error('Save stock error', e);
    } finally {
      this.isSaving.set(false);
    }
  }

  getDayLabel(index: number): string {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days[index];
  }

  asString(val: unknown): string { return String(val || ''); }
  
  formatPrice(val: number | string): string {
    return this.dataService.formatAmount(val);
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'Préparation';
      case 'shipped': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'pending': return 'schedule';
      case 'confirmed': return 'check_circle';
      case 'preparing': return 'pending';
      case 'shipped': return 'local_shipping';
      case 'delivered': return 'verified';
      case 'cancelled': return 'cancel';
      default: return 'help_outline';
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'bg-[#fff3ec] text-[#FF6200]';
      case 'confirmed': return 'bg-[#e8f4fd] text-[#0984e3]';
      case 'preparing': return 'bg-[#fef9e6] text-[#f39c12]';
      case 'shipped': return 'bg-[#e8fdf5] text-[#00b894]';
      case 'delivered': return 'bg-[#eafaf1] text-[#00925c]';
      case 'cancelled': return 'bg-[#fde8e8] text-[#f5222d]';
      default: return 'bg-[#f0f2f5] text-[#5a5e72]';
    }
  }
}
