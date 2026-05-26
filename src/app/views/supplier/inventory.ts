import { ChangeDetectionStrategy, Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService, OchapProduct, OchapOrder } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Unsubscribe } from 'firebase/firestore';
import * as d3 from 'd3';

@Component({
  selector: 'app-supplier-inventory',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in pb-20 relative z-10 px-6">
      
      <!-- Inventory Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-[#0D1B2A] tracking-tight uppercase italic underline decoration-primary decoration-4 underline-offset-8">Gestion du stock</h2>
          <p class="text-xs text-[#5a5e72] mt-4 font-medium">Suivi en temps réel de vos disponibilités et réapprovisionnement</p>
        </div>
        <div class="flex items-center gap-3">
           @if (lowStockCount() > 0) {
              <button (click)="openReorderModal()" class="h-10 px-5 rounded-full bg-gradient-to-r from-[#FF6200] to-[#D4AF37] text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 animate-pulse">
                <mat-icon class="scale-75">shopping_cart</mat-icon>
                One-Click Reorder ({{ lowStockCount() }})
              </button>
           }
           <button (click)="exportInventory()" class="h-10 px-5 rounded-full border border-[#e4e6ea] text-[#5a5e72] text-[11px] font-black uppercase tracking-widest hover:border-[#FF6200] hover:text-[#FF6200] transition-all flex items-center gap-2">
             <mat-icon class="scale-75">download</mat-icon>
             Exporter CSV
           </button>
        </div>
      </div>

      <!-- Inventory Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#e8f4fd] text-[#0984e3] flex items-center justify-center">
            <mat-icon>inventory_2</mat-icon>
          </div>
          <div>
            <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest">Total Articles</p>
            <p class="text-xl font-black text-[#0D1B2A] italic font-price">{{ products().length }}</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#fdedec] text-[#e17055] flex items-center justify-center">
            <mat-icon>warning</mat-icon>
          </div>
          <div>
            <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest">Articles Critiques</p>
            <p class="text-xl font-black text-[#0D1B2A] italic font-price">{{ lowStockCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#e8fdf5] text-[#00b894] flex items-center justify-center">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div>
            <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest">Valeur Stock</p>
            <p class="text-xl font-black text-[#0D1B2A] italic font-price">{{ totalValue() }} FCFA</p>
          </div>
        </div>
      </div>

      <!-- GRAPHICAL DETAILED LOGISTIC PROJECTIONS & ACCELERATIONS -->
      @if (lowStockCount() > 0 && chartSvgData(); as chart) {
         <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- D3 Projections Curve Box -->
            <div class="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm flex flex-col justify-between">
               <div>
                  <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-wider flex items-center gap-2">
                     <mat-icon class="text-[#FF6200]">waves</mat-icon>
                     Projection de Déplétion à 30 Jours (Calculé via D3)
                  </h3>
                  <p class="text-[10px] text-[#5a5e72] uppercase mt-1 tracking-wider font-bold">Modélisation prévisionnelle basée sur la vélocité mensuelle</p>
               </div>
               
               <!-- SVG Chart Container -->
               <div class="relative w-full overflow-x-auto no-scrollbar py-4 flex justify-center">
                  <svg [attr.width]="chart.width" [attr.height]="chart.height" class="overflow-visible select-none max-w-full">
                     <!-- Grid Horizontal Lines -->
                     @for (tick of chart.yTicks; track tick) {
                        <line [attr.x1]="chart.margin.left" 
                              [attr.y1]="chart.yScale(tick)" 
                              [attr.x2]="chart.width - chart.margin.right" 
                              [attr.y2]="chart.yScale(tick)" 
                              stroke="#f1f5f9" 
                              stroke-width="1" />
                        <text [attr.x]="chart.margin.left - 10" 
                              [attr.y]="chart.yScale(tick) + 3" 
                              text-anchor="end" 
                              class="fill-muted font-mono text-[8px] font-bold">
                           {{ tick }}u
                        </text>
                     }
                     
                     <!-- X-Axis Line -->
                     <line [attr.x1]="chart.margin.left" 
                           [attr.y1]="chart.height - chart.margin.bottom" 
                           [attr.x2]="chart.width - chart.margin.right" 
                           [attr.y2]="chart.height - chart.margin.bottom" 
                           stroke="#0d1b2a" 
                           stroke-width="1.5" />
                     
                     <!-- X-Axis Labels -->
                     @for (day of chart.xTicks; track day) {
                        <text [attr.x]="chart.xScale(day)" 
                              [attr.y]="chart.height - chart.margin.bottom + 16" 
                              text-anchor="middle" 
                              class="fill-muted font-mono text-[8px] font-bold">
                           {{ day === 0 ? 'Auj.' : 'J-' + day }}
                        </text>
                     }
                     
                     <!-- Critical Threshold line -->
                     <line [attr.x1]="chart.margin.left" 
                           [attr.y1]="chart.yScale(5)" 
                           [attr.x2]="chart.width - chart.margin.right" 
                           [attr.y2]="chart.yScale(5)" 
                           stroke="#e17055" 
                           stroke-dasharray="4 4" 
                           stroke-width="1.5" />
                     <text [attr.x]="chart.width - chart.margin.right + 10" 
                           [attr.y]="chart.yScale(5) + 3" 
                           class="fill-red-500 font-bold text-[8px] uppercase tracking-widest">
                        SEUIL CRITIQUE (5u)
                     </text>
                     
                     <!-- Trajectories -->
                     @for (line of chart.lines; track line.name) {
                        <path [attr.d]="line.d" 
                              fill="none" 
                              [attr.stroke]="line.color" 
                              stroke-width="3" 
                              stroke-linecap="round" />
                        <!-- Tooltip Bullet -->
                        <circle [attr.cx]="chart.xScale(30)" 
                                [attr.cy]="line.lastY" 
                                r="4" 
                                [attr.fill]="line.color" 
                                stroke="white" 
                                stroke-width="1.5" />
                        <text [attr.x]="line.lastX" 
                              [attr.y]="line.lastY + 3" 
                              [attr.fill]="line.color" 
                              class="font-display font-medium text-[8px] uppercase tracking-wider">
                           {{ line.name.slice(0, 10) }}... ({{ line.daysToZero }}j)
                        </text>
                     }
                  </svg>
               </div>
            </div>
            
            <!-- Depletion Explanatory metrics panel -->
            <div class="bg-navy p-8 rounded-[2.5rem] text-white shadow-lg flex flex-col justify-between">
               <div>
                  <h4 class="text-sm font-bold uppercase tracking-wider text-primary mb-6">Ajustements Urgents</h4>
                  <div class="space-y-4">
                     @for (pr of lowStockProductsProjections(); track pr.product.id; let i = $index) {
                        @if (i < 3) {
                           <div class="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                              <div class="min-w-0 pr-2">
                                 <p class="text-xs font-black truncate text-white">{{ pr.product.name }}</p>
                                 <p class="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Vente : {{ pr.velocity }} u/jour</p>
                              </div>
                              <div class="text-right shrink-0">
                                 <p class="text-[8px] font-black uppercase text-red-400 font-sans tracking-tight">Rupture dans</p>
                                 <p class="text-sm font-black font-price text-[#FF6200]">
                                    {{ pr.daysToZero !== 'Jamais' ? pr.daysToZero + ' jours' : 'Jamais' }}
                                 </p>
                              </div>
                           </div>
                        }
                     }
                  </div>
               </div>
               
               <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-xs italic text-white/60">
                  <span class="font-bold text-primary block not-italic uppercase tracking-widest text-[9px] mb-1">MÉTHODOLOGIE DU RAPPORT</span>
                  Les trajectoires calculées représentent la vitesse d'écoulement théorique constatée au cours des 30 derniers jours d'activité sur Abidjan.
               </div>
            </div>
         </div>
      }

      <!-- Inventory Table Card -->
      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
        <div class="overflow-x-auto no-scrollbar">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-[#fcfcfd]">
                <th class="px-6 py-6 text-center w-12">
                   <input type="checkbox" id="select-all" [checked]="selectAllChecked" (change)="toggleSelectAll($event)" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer">
                </th>
                <th class="px-6 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Produit</th>
                <th class="px-6 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest hidden md:table-cell">Catégorie</th>
                <th class="px-6 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Stock Actuel</th>
                <th class="px-6 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Seuil Alerte</th>
                <th class="px-6 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">État</th>
                <th class="px-6 py-6 text-right text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f0f2f5]">
              @for (p of products(); track p.id) {
                <tr class="hover:bg-[#fafafa] transition-colors group">
                  <td class="px-6 py-6 text-center">
                     <input type="checkbox" [checked]="selectedProductIds()[p.id]" (change)="toggleSelectItem(p.id, $event)" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer">
                  </td>
                  <td class="px-6 py-6">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-[#f0f2f5] overflow-hidden border border-[#e4e6ea] shrink-0 relative group/img">
                        <img [src]="p.imageUrl || 'https://picsum.photos/seed/'+p.id+'/100/100'" [alt]="p.name" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all cursor-pointer" 
                             (click)="triggerImageImport(p)"
                             role="button"
                             aria-label="Changer l'image"
                             tabindex="0"
                             (keydown.enter)="triggerImageImport(p)">
                          <mat-icon class="text-white scale-75">add_a_photo</mat-icon>
                        </div>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs font-black text-[#0D1B2A] line-clamp-1 italic">{{ p.name }}</span>
                        <span class="text-[9px] text-[#9699a8] font-mono tracking-tighter">{{ p.id }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-6 hidden md:table-cell">
                    <span class="text-[10px] font-black text-[#5a5e72] uppercase tracking-wider bg-[#f0f2f5] px-2.5 py-1 rounded-lg">{{ p.category }}</span>
                  </td>
                  <td class="px-6 py-6">
                    <div class="flex items-center gap-3">
                       <div class="flex items-center bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl overflow-hidden shadow-sm">
                          <button (click)="quickStockUpdate(p, -1)" class="w-8 h-8 flex items-center justify-center hover:bg-[#f0f2f5] transition-all text-[#5a5e72]">
                            <mat-icon class="scale-50">remove</mat-icon>
                          </button>
                          <input type="number" 
                                 [ngModel]="p.stock" 
                                 (ngModelChange)="updateStock(p.id, $event)"
                                 class="w-10 h-8 text-center text-[11px] font-black outline-none bg-transparent appearance-none">
                          <button (click)="quickStockUpdate(p, 1)" class="w-8 h-8 flex items-center justify-center hover:bg-[#f0f2f5] transition-all text-[#5a5e72]">
                            <mat-icon class="scale-50">add</mat-icon>
                          </button>
                       </div>
                       <span class="text-[9px] font-bold text-[#9699a8] uppercase">UNITÉS</span>
                    </div>
                  </td>
                  <td class="px-6 py-6">
                    <span class="text-xs font-black text-[#0D1B2A] font-price italic">{{ p.threshold || 5 }}</span>
                  </td>
                  <td class="px-6 py-6">
                    <span [class]="getStockStatusClass(p.stock, p.threshold)" class="text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {{ getStockStatusLabel(p.stock, p.threshold) }}
                    </span>
                  </td>
                  <td class="px-6 py-6 text-right">
                    <div class="flex justify-end gap-2">
                       <a [routerLink]="['/products', p.id]" class="w-9 h-9 rounded-xl bg-gray-50 text-gray-600 hover:bg-[#0D1B2A] hover:text-white transition-all flex items-center justify-center" title="Voir les détails">
                          <mat-icon class="scale-75">visibility</mat-icon>
                       </a>
                       <button (click)="triggerImageImport(p)" class="w-9 h-9 rounded-xl bg-[#e8f4fd] text-[#0984e3] hover:scale-105 transition-all flex items-center justify-center" title="Importer Image">
                         <mat-icon class="scale-75">image</mat-icon>
                       </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                   <td colspan="7" class="py-24 text-center opacity-30">
                      <mat-icon class="scale-[3] mb-6 text-[#1a1a2e]">warehouse</mat-icon>
                      <h3 class="text-sm font-black uppercase tracking-widest">Entrepôt Vide</h3>
                      <p class="text-[10px] font-medium mt-2">Ajoutez vos premiers produits au catalogue pour gérer leur stock.</p>
                   </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- BATCH ACTIONS FLOATING BAR -->
      @if (selectedCount() > 0) {
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0D1B2A] text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 z-[100] flex items-center gap-6 animate-fade-in">
           <span class="text-xs font-black uppercase tracking-wider text-primary">{{ selectedCount() }} sélectionné(s)</span>
           <div class="flex items-center gap-2">
              <button (click)="openBatchModal()" class="px-4 py-2 bg-primary hover:bg-primary-light text-navy rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95">
                 <mat-icon class="scale-75">edit_note</mat-icon>
                 Mise à jour groupée
              </button>
              <button (click)="clearSelection()" class="px-4 py-2 bg-white/15 hover:bg-white/20 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
                 Annuler
              </button>
           </div>
        </div>
      }

      <!-- BATCH ACTIONS MODAL -->
      @if (batchModalOpen()) {
         <div class="fixed inset-0 z-[110] flex items-center justify-center p-6 lg:p-12">
            <div class="absolute inset-0 bg-[#0D1B2A]/80 backdrop-blur-md" (click)="closeBatchModal()" role="button" aria-label="Fermer" tabindex="0"></div>
            <div class="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl animate-fade-in border border-[#e4e6ea]">
               <button (click)="closeBatchModal()" class="absolute top-8 right-8 text-muted hover:text-dark">
                  <mat-icon>close</mat-icon>
               </button>
               
               <div class="mb-8">
                  <h3 class="text-2xl font-black text-[#0D1B2A] tracking-tighter mb-2 italic">Actions <span class="text-primary">Groupées.</span></h3>
                  <p class="text-xs text-[#5a5e72] font-medium">Appliquer aux {{ selectedCount() }} produits sélectionnés</p>
               </div>
               
               <div class="space-y-6">
                  <!-- Action Chooser -->
                  <div>
                     <span class="text-[10px] font-black text-[#0D1B2A] uppercase tracking-widest block mb-2">Choisir l'opération</span>
                     <div class="grid grid-cols-2 gap-4">
                        <button (click)="batchActionType.set('stock')" 
                                [class.border-primary]="batchActionType() === 'stock'"
                                [class.bg-primary/5]="batchActionType() === 'stock'"
                                class="p-4 border-2 border-surface-3 rounded-2xl text-left hover:border-primary transition-all">
                           <mat-icon class="text-primary mb-1">warehouse</mat-icon>
                           <p class="text-xs font-black text-[#0D1B2A] uppercase">Définir Stock</p>
                           <p class="text-[10px] text-muted">Ajuste les quantités</p>
                        </button>
                        <button (click)="batchActionType.set('price_multi')" 
                                [class.border-primary]="batchActionType() === 'price_multi'"
                                [class.bg-primary/5]="batchActionType() === 'price_multi'"
                                class="p-4 border-2 border-surface-3 rounded-2xl text-left hover:border-primary transition-all">
                           <mat-icon class="text-primary mb-1">percent</mat-icon>
                           <p class="text-xs font-black text-[#0D1B2A] uppercase">Multiplicateur Prix</p>
                           <p class="text-[10px] text-muted">Ajuste les tarifs par %</p>
                        </button>
                     </div>
                  </div>

                  <!-- Input Fields -->
                  @if (batchActionType() === 'stock') {
                     <div>
                        <label for="batch-stock" class="text-[10px] font-black text-[#0D1B2A] uppercase tracking-widest block mb-2">Nouveau niveau de stock</label>
                        <input id="batch-stock" type="number" [(ngModel)]="batchStockValue" class="w-full h-12 bg-surface-2 border border-surface-3 rounded-xl px-4 text-sm font-bold focus:outline-none focus:border-primary">
                        <p class="text-[10px] text-muted mt-1">Tous les produits sélectionnés auront ce niveau de stock spécifié.</p>
                     </div>
                  } @else {
                     <div>
                        <label for="batch-multi" class="text-[10px] font-black text-[#0D1B2A] uppercase tracking-widest block mb-2">Facteur multiplicateur (ex. 1.05 = +5%, 0.90 = -10%)</label>
                        <input id="batch-multi" type="number" step="0.01" [(ngModel)]="batchPriceMultiplier" class="w-full h-12 bg-surface-2 border border-surface-3 rounded-xl px-4 text-sm font-bold focus:outline-none focus:border-primary">
                        <p class="text-[10px] text-muted mt-1 font-semibold">Les prix initiaux seront multipliés par ce facteur.</p>
                     </div>
                  }
                  
                  <button (click)="applyBatchAction()" [disabled]="isSavingBatch()" class="w-full h-14 bg-navy hover:bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg">
                     @if (isSavingBatch()) {
                        <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     } @else {
                        <mat-icon>check_circle</mat-icon>
                        Confirmer et Appliquer
                     }
                  </button>
               </div>
            </div>
         </div>
      }

      <!-- ONE-CLICK PURCHASE ORDER MODAL DOCUMENT SHEET -->
      @if (reorderModalOpen() && lowStockCount() > 0) {
         <div class="fixed inset-0 z-[120] flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
            <div class="absolute inset-0 bg-[#0D1B2A]/90 backdrop-blur-md" (click)="reorderModalOpen.set(false)" role="button" aria-label="Fermer" tabindex="0"></div>
            <div class="relative w-full max-w-3xl bg-white rounded-[3rem] p-10 shadow-2xl animate-fade-in border border-[#e4e6ea] my-auto z-10 flex flex-col max-h-[90vh]">
               <button (click)="reorderModalOpen.set(false)" class="absolute top-8 right-8 text-muted hover:text-dark">
                  <mat-icon>close</mat-icon>
               </button>
               
               <!-- PO Title -->
               <div class="mb-6 flex justify-between items-start border-b border-surface-2 pb-6">
                  <div>
                     <h3 class="text-2xl font-black text-[#0D1B2A] tracking-tighter italic">Bon de Commande d'Approvisionnement</h3>
                     <p class="text-xs text-muted mt-1">Généré automatiquement par O'CHAP Central Logistics — Référence <span class="font-mono font-bold text-primary">#{{ generatedPoRef() }}</span></p>
                  </div>
                  <div class="bg-primary/20 text-navy px-4 py-1.5 rounded-xl text-xs font-mono font-bold text-center">
                     STATUT : BROUILLON
                  </div>
               </div>
               
               <!-- PO Information -->
               <div class="grid grid-cols-2 gap-6 mb-6 text-xs border-b border-surface-2 pb-6">
                  <div class="space-y-1">
                     <p class="font-black text-muted uppercase tracking-wider text-[9px]">Fournisseur (Émetteur)</p>
                     <p class="font-bold text-[#0D1B2A] text-sm">{{ supplierName() }}</p>
                     <p class="text-[#5a5e72]">{{ authService.profile$()?.['email'] || 'contact@fournisseur.com' }}</p>
                     <p class="text-[#5a5e72]">{{ authService.profile$()?.['phoneNumber'] || '+225 XX XX XX XX' }}</p>
                     <p class="text-[#5a5e72]">{{ authService.profile$()?.['city'] || 'Abidjan' }}, Côte d'Ivoire</p>
                  </div>
                  <div class="space-y-1 text-right">
                     <p class="font-black text-muted uppercase tracking-wider text-[9px]">Destinataire (Livraison)</p>
                     <p class="font-bold text-[#0D1B2A] text-sm">O’CHAP Central Distribution</p>
                     <p class="text-[#5a5e72]">Boulevard Giscard d'Estaing</p>
                     <p class="text-[#5a5e72]">Zone Industrielle, Abidjan</p>
                     <p class="text-[#5a5e72]">logistic-center&#64;ochapere.com</p>
                  </div>
               </div>

               <!-- Table of Products to Reorder -->
               <div class="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-1">
                  <p class="font-black text-muted uppercase tracking-wider text-[9px] mb-2">Articles sous le seuil d'alerte</p>
                  <table class="w-full text-xs">
                     <thead>
                        <tr class="bg-surface-2 border-b border-surface-3">
                           <th class="p-3 text-left">Produit</th>
                           <th class="p-3 text-center">Stock</th>
                           <th class="p-3 text-center">Seuil</th>
                           <th class="p-3 text-center w-24">Qté Commande</th>
                           <th class="p-3 text-right">Prix Unitaire</th>
                           <th class="p-3 text-right">Total</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-[#f0f2f5]">
                        @for (p of lowStockProducts(); track p.id) {
                           <tr>
                              <td class="p-3">
                                 <p class="font-bold text-dark">{{ p.name }}</p>
                                 <p class="text-[8px] font-mono text-muted">{{ p.category }}</p>
                              </td>
                              <td class="p-3 text-center">{{ p.stock }}</td>
                              <td class="p-3 text-center text-red-500 font-bold">{{ p.threshold || 5 }}</td>
                              <td class="p-3 text-center">
                                 <input type="number" [(ngModel)]="reorderQuantities[p.id]" class="w-16 h-8 border border-surface-3 rounded text-center font-bold">
                              </td>
                              <td class="p-3 text-right font-mono">{{ formatPrice(p.price) }} FCFA</td>
                              <td class="p-3 text-right font-bold font-mono">{{ formatPrice(p.price * (reorderQuantities[p.id] || 10)) }} FCFA</td>
                           </tr>
                        }
                     </tbody>
                  </table>
               </div>

               <!-- PO Total & Submission -->
               <div class="border-t border-surface-2 pt-6 mt-6 flex justify-between items-center bg-surface-1 p-6 rounded-2xl">
                  <div>
                     <p class="text-[9px] font-black text-muted uppercase tracking-wider">Total Commande Estimé</p>
                     <p class="text-2xl font-black text-[#0D1B2A] font-price">{{ formatPrice(calculatePoTotal()) }} <small class="text-xs">FCFA</small></p>
                  </div>
                  <div class="flex gap-3">
                     <button (click)="imprimerPo()" class="px-5 h-12 border border-[#e4e6ea] rounded-xl text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center gap-2">
                        <mat-icon class="scale-75">print</mat-icon>
                        Imprimer
                     </button>
                     <button (click)="sendPurchaseOrder()" [disabled]="isSubmittingPo()" class="px-6 h-12 bg-[#FF6200] hover:bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-primary/20">
                        @if (isSubmittingPo()) {
                           <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        } @else {
                           <mat-icon class="scale-75">send_and_archive</mat-icon>
                           Valider & Envoyer
                        }
                     </button>
                  </div>
               </div>
            </div>
         </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `]
})
export class SupplierInventory implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  public dataService = inject(DataService);
  
  public products = computed(() => this.dataService.products$() as OchapProduct[]);
  
  public lowStockCount = computed(() => {
    return this.products().filter(p => (p.stock || 0) <= (p.threshold || 5)).length;
  });

  public totalValue = computed(() => {
    const total = this.products().reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.stock || 0)), 0);
    return Number(total).toLocaleString('fr-FR');
  });

  // Checkboxes State
  public selectedProductIds = signal<Record<string, boolean>>({});
  public selectAllChecked = false;
  
  // Batch updates Modal State
  public batchModalOpen = signal(false);
  public batchActionType = signal<'stock' | 'price_multi'>('stock');
  public batchStockValue = 10;
  public batchPriceMultiplier = 1.05;
  public isSavingBatch = signal(false);

  // Purchase Order State
  public reorderModalOpen = signal(false);
  public isSubmittingPo = signal(false);
  public generatedPoRef = signal('PO-2026-X');
  public reorderQuantities: Record<string, number> = {};

  public supplierName = computed(() => {
    const profile = this.authService.profile$() as Record<string, unknown>;
    return (profile?.['businessName'] as string) || (profile?.['displayName'] as string) || (this.authService.user$()?.email?.split('@')[0]) || 'Boutique O\'CHAP';
  });

  public lowStockProducts = computed(() => {
    return this.products().filter(p => (p.stock || 0) <= (p.threshold || 5));
  });

  // Calculate depletion variables using D3 scaling & math logic
  public lowStockProductsProjections = computed(() => {
    const prods = this.lowStockProducts();
    const orders = this.dataService.orders$() as OchapOrder[];
    
    return prods.map(p => {
      // Calculate realistic sales velocity based on orders history
      let velocity = 0.5; // fallback units/day
      let totalSold = 0;
      
      orders.forEach(o => {
        if (o.status !== 'cancelled') {
          o.items?.forEach(item => {
            if (item.id === p.id) {
              totalSold += (item.quantity || 0);
            }
          });
        }
      });
      
      if (totalSold > 0) {
        velocity = Math.max(0.1, totalSold / 30);
      } else {
        velocity = p.price > 200000 ? 0.3 : 0.7;
      }
      
      // Points for 30 days projection timeline
      const points: { day: number; stock: number }[] = [];
      for (let day = 0; day <= 30; day += 5) {
        const projected = Math.max(0, (p.stock || 0) - (velocity * day));
        points.push({ day, stock: projected });
      }
      
      const daysToZero = velocity > 0 ? (p.stock || 0) / velocity : 999;
      
      return {
        product: p,
        points,
        daysToZero: daysToZero < 999 ? Math.round(daysToZero) : 'Jamais',
        velocity: velocity.toFixed(2),
      };
    });
  });

  // Compute D3 structured path and scale specs for our svg drawing
  public chartSvgData = computed(() => {
    const projections = this.lowStockProductsProjections();
    if (projections.length === 0) return null;
    
    const width = 600;
    const height = 260;
    const margin = { top: 20, right: 120, bottom: 40, left: 40 };
    
    const maxStock = Math.max(10, ...projections.map(pr => pr.product.stock || 0));
    
    // Config D3 Scales
    const xScale = d3.scaleLinear()
      .domain([0, 30])
      .range([margin.left, width - margin.right]);
      
    const yScale = d3.scaleLinear()
      .domain([0, maxStock])
      .range([height - margin.bottom, margin.top]);
      
    const xTicks = [0, 5, 10, 15, 20, 25, 30];
    const yTicks = yScale.ticks(5);
    
    // Construct Path string generator
    const lineGen = d3.line<{ day: number; stock: number }>()
      .x(d => xScale(d.day))
      .y(d => yScale(d.stock));
      
    const colors = ['#FF6200', '#0984e3', '#00b894', '#f39c12', '#6c5ce7'];
    
    const lines = projections.map((pr, idx) => {
      const dAttr = lineGen(pr.points) || '';
      const color = colors[idx % colors.length];
      const lastPt = pr.points[pr.points.length - 1];
      
      return {
        name: pr.product.name,
        d: dAttr,
        color,
        daysToZero: pr.daysToZero,
        velocity: pr.velocity,
        lastX: xScale(30) + 8,
        lastY: yScale(lastPt.stock)
      };
    });
    
    return {
      width,
      height,
      margin,
      lines,
      xTicks,
      yTicks,
      xScale,
      yScale,
    };
  });

  // Selection Logic
  public selectedCount = computed(() => {
    return Object.values(this.selectedProductIds()).filter(Boolean).length;
  });

  public toggleSelectItem(id: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedProductIds.update(current => ({
      ...current,
      [id]: checked
    }));
    this.updateSelectAllSyncState();
  }

  public toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAllChecked = checked;
    
    const nextIds: Record<string, boolean> = {};
    this.products().forEach(p => {
       nextIds[p.id] = checked;
    });
    this.selectedProductIds.set(nextIds);
  }

  private updateSelectAllSyncState() {
    const prods = this.products();
    if (prods.length === 0) {
      this.selectAllChecked = false;
      return;
    }
    const allChecked = prods.every(p => this.selectedProductIds()[p.id]);
    this.selectAllChecked = allChecked;
  }

  public clearSelection() {
    this.selectedProductIds.set({});
    this.selectAllChecked = false;
  }

  // Modals management
  public openBatchModal() {
    this.batchModalOpen.set(true);
  }

  public closeBatchModal() {
    this.batchModalOpen.set(false);
  }

  public openReorderModal() {
    // Generate unique PO ID
    const rnd = Math.floor(1000 + Math.random() * 9000);
    this.generatedPoRef.set(`PO-2026-${rnd}`);
    
    // Fill default suggested reorder quantities
    this.lowStockProducts().forEach(p => {
       this.reorderQuantities[p.id] = Math.max(10, (p.threshold || 5) * 3);
    });
    
    this.reorderModalOpen.set(true);
  }

  public calculatePoTotal() {
    let total = 0;
    this.lowStockProducts().forEach(p => {
       const qty = this.reorderQuantities[p.id] || 10;
       total += (p.price || 0) * qty;
    });
    return total;
  }

  public imprimerPo() {
    window.print();
  }

  public async sendPurchaseOrder() {
    this.isSubmittingPo.set(true);
    try {
      // Simulate transmitting PO items to O'CHAP core logic & increasing stock
      for (const p of this.lowStockProducts()) {
        const qty = Number(this.reorderQuantities[p.id] || 10);
        const current = Number(p.stock || 0);
        await this.dataService.updateStock(p.id, current + qty);
      }
      
      // Notify the logistics channels
      const details = this.lowStockProducts().map(p => `${p.name} (x${this.reorderQuantities[p.id] || 10})`).join(', ');
      await this.dataService.addNotification(
         'admin', 
         'Bon de commande validé', 
         `Le fournisseur ${this.supplierName()} a expédié l'approvisionnement : ${details}`, 
         'system'
      );
      
      // Close reorder panel
      this.reorderModalOpen.set(false);
      alert(`Le bon de commande ${this.generatedPoRef()} a été transmis avec succès ! Les stocks correspondants ont été mis à jour.`);
    } catch (e) {
      console.error('Failed to submit reorder', e);
    } finally {
      this.isSubmittingPo.set(false);
    }
  }

  // Action Apply group rules
  public async applyBatchAction() {
    const ids = Object.entries(this.selectedProductIds())
      .filter(entry => entry[1])
      .map(entry => entry[0]);

    if (ids.length === 0) return;

    this.isSavingBatch.set(true);
    try {
      const type = this.batchActionType();
      if (type === 'stock') {
        const value = Number(this.batchStockValue);
        for (const id of ids) {
          await this.dataService.updateStock(id, value);
        }
      } else {
        const factor = Number(this.batchPriceMultiplier);
        for (const id of ids) {
          const product = this.products().find(p => p.id === id);
          if (product) {
            const newPrice = Math.round((product.price || 0) * factor);
            const updates: Partial<OchapProduct> = { price: newPrice };
            if (product['wholesalePrice']) {
              updates['wholesalePrice'] = Math.round((Number(product['wholesalePrice'])) * factor);
            }
            if (product['retailPrice']) {
              updates['retailPrice'] = Math.round((Number(product['retailPrice'])) * factor);
            }
            await this.dataService.updateProduct(id, updates);
          }
        }
      }
      this.clearSelection();
      this.batchModalOpen.set(false);
    } catch (e) {
      console.error('Batch update failed', e);
    } finally {
      this.isSavingBatch.set(false);
    }
  }

  private unsub?: Unsubscribe;

  ngOnInit() {
    const user = this.authService.user$();
    if (user) {
      this.unsub = this.dataService.watchSupplierProducts(user.uid);
    }
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  asString(val: unknown): string { return String(val || ''); }
  
  formatPrice(val: number | string): string {
    return Number(val || 0).toLocaleString('fr-FR');
  }

  updateStock(productId: string, newStock: number) {
    if (newStock < 0) return;
    this.dataService.updateStock(productId, newStock);
  }

  quickStockUpdate(product: OchapProduct, delta: number) {
    const current = Number(product.stock || 0);
    const newVal = Math.max(0, current + delta);
    this.updateStock(product.id, newVal);
  }

  async triggerImageImport(product: OchapProduct) {
    const url = window.prompt("Entrez l'URL de la nouvelle image pour " + product.name, product.imageUrl || '');
    if (url !== null && url.trim() !== '') {
      await this.dataService.updateProduct(product.id, { imageUrl: url });
    }
  }

  getStockStatusLabel(stock: number | string, threshold = 5): string {
    const val = Number(stock || 0);
    if (val === 0) return 'Rupture';
    if (val <= threshold) return 'Critique';
    return 'En Stock';
  }

  getStockStatusClass(stock: number | string, threshold = 5): string {
    const val = Number(stock || 0);
    if (val === 0) return 'bg-[#fdedec] text-[#e17055]';
    if (val <= threshold) return 'bg-[#fff3ec] text-[#FF6200]';
    return 'bg-[#e8fdf5] text-[#00b894]';
  }

  exportInventory() {
    console.log('Exporting inventory CSV data...');
    const data = this.products().map(p => ({
       ID: p.id,
       Nom: p.name,
       Categorie: p.category,
       Prix: p.price,
       Stock: p.stock,
       Seuil: p.threshold || 5
    }));
    
    // Build CSV file string
    const headers = 'ID,Nom,Catégorie,Prix,Stock,Seuil\n';
    const rows = data.map(r => `"${r.ID}","${r.Nom}","${r.Categorie}",${r.Prix},${r.Stock},${r.Seuil}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventaire_${this.supplierName()}_2026.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
