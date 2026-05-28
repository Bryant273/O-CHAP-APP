import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService, OchapProduct } from '../../services/data.service';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule, ImageCropperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight truncate max-w-md">Gestion de l'Inventaire</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Administration centralisée du catalogue O'CHAP</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="dataService.exportProductsToExcel()" class="h-11 px-6 rounded-xl border border-surface-2 text-navy text-xs font-bold hover:bg-surface-2 transition-all flex items-center gap-2">
            <mat-icon class="scale-75">download</mat-icon> Excel
          </button>
          <button (click)="analyzeInventoryAI()" [disabled]="analyzingAI()" class="h-11 px-6 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-black shadow-sm transition-all flex items-center gap-2 hover:bg-indigo-100 border border-indigo-100">
            <mat-icon class="scale-75">{{ analyzingAI() ? 'refresh' : 'auto_awesome' }}</mat-icon> 
            {{ analyzingAI() ? 'Analyse...' : 'O-CHAP AI Insight' }}
          </button>
          <button (click)="clearAllProducts()" class="h-11 px-6 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-all flex items-center gap-2">
            <mat-icon class="scale-75">delete_sweep</mat-icon> Tout effacer
          </button>
          <button (click)="openAddModal()" class="bg-primary text-white h-11 px-6 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-navy transition-all active:scale-95">
            <mat-icon class="scale-75">add_box</mat-icon> Nouveau Produit
          </button>
        </div>
      </div>

      <!-- AI Insights Panel -->
      @if (aiReport()) {
        <div class="bg-gradient-to-br from-indigo-900 to-navy p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <mat-icon class="text-white">psychology</mat-icon>
                </div>
                <div>
                  <h4 class="text-sm font-black uppercase tracking-[0.2em]">Rapport Stratégique IA</h4>
                  <p class="text-[10px] text-white/60 font-bold">Généré le {{ today | date:'dd/MM HH:mm' }}</p>
                </div>
              </div>
              <button (click)="aiReport.set('')" class="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-all">
                <mat-icon class="scale-75">close</mat-icon>
              </button>
            </div>
            <div class="prose prose-invert prose-xs max-w-none text-white/90 leading-relaxed font-medium whitespace-pre-wrap">
              {{ aiReport() }}
            </div>
          </div>
        </div>
      }

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-surface-2">
        <button (click)="activeTab.set('products')" 
                [class.border-primary]="activeTab() === 'products'"
                [class.text-primary]="activeTab() === 'products'"
                class="px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 border-transparent transition-all">
          Catalogue Produits
        </button>
        <button (click)="activeTab.set('categories')" 
                [class.border-primary]="activeTab() === 'categories'"
                [class.text-primary]="activeTab() === 'categories'"
                class="px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 border-transparent transition-all">
          Gestion Catégories
        </button>
      </div>

      @if (activeTab() === 'products') {
        <!-- Filters & Stats Minimal Strip -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div class="bg-white p-6 rounded-3xl border border-surface-2 flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                 <mat-icon>inventory_2</mat-icon>
              </div>
              <div>
                 <p class="text-[10px] font-black uppercase text-muted tracking-widest">Total Articles</p>
                 <p class="text-xl font-black text-navy">{{dataService.products$().length}}</p>
              </div>
           </div>
           <div class="bg-white p-6 rounded-3xl border border-surface-2 flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                 <mat-icon>storefont</mat-icon>
              </div>
              <div>
                 <p class="text-[10px] font-black uppercase text-muted tracking-widest">Partenaires</p>
                 <p class="text-xl font-black text-navy">{{dataService.suppliers$().length}} Boutiques</p>
              </div>
           </div>
           <div class="bg-white p-6 rounded-3xl border border-surface-2 flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                 <mat-icon>warning</mat-icon>
              </div>
              <div>
                 <p class="text-[10px] font-black uppercase text-muted tracking-widest">Ruptures</p>
                 <p class="text-xl font-black text-navy">{{lowStockCount()}} Items</p>
              </div>
           </div>
        </div>

        <!-- Inventory controls -->
        <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-surface-2">
          <div class="flex flex-wrap items-center gap-4 flex-1">
            <div class="relative flex-1 min-w-[240px]">
              <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-muted scale-75">search</mat-icon>
              <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="currentPage.set(1)"
                     placeholder="Rechercher un produit..." 
                     class="w-full h-11 pl-12 pr-4 bg-surface-2 rounded-xl text-xs font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
            </div>
            
            <select [(ngModel)]="selectedCategoryFilter" (ngModelChange)="currentPage.set(1)"
                    class="h-11 px-4 bg-surface-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-transparent focus:border-primary focus:bg-white outline-none cursor-pointer">
              <option value="">Toutes Catégories</option>
              @for (cat of dataService.categories$(); track cat.id) {
                <option [value]="cat.name">{{cat.name}}</option>
              }
            </select>

            <select [(ngModel)]="sortBy" (ngModelChange)="currentPage.set(1)"
                    class="h-11 px-4 bg-surface-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-transparent focus:border-primary focus:bg-white outline-none cursor-pointer">
              <option value="name">Trier par Nom</option>
              <option value="price_asc">Prix Croissant</option>
              <option value="price_desc">Prix Décroissant</option>
              <option value="stock_asc">Stock (Moins)</option>
              <option value="stock_desc">Stock (Plus)</option>
            </select>

            <button (click)="showLowStockOnly.set(!showLowStockOnly())"
                    [class.bg-rose-50]="showLowStockOnly()"
                    [class.text-rose-600]="showLowStockOnly()"
                    [class.border-rose-100]="showLowStockOnly()"
                    class="h-11 px-6 rounded-xl border border-surface-2 text-navy text-[10px] font-black uppercase tracking-widest hover:bg-surface-2 transition-all flex items-center gap-2">
              <mat-icon class="scale-75">{{ showLowStockOnly() ? 'filter_list_off' : 'notification_important' }}</mat-icon>
              {{ showLowStockOnly() ? 'Tous les produits' : 'Stock Faible Uniquement' }}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button (click)="toggleColumn('brand')" 
                   [class.bg-primary]="visibleColumns().has('brand')"
                   [class.text-white]="visibleColumns().has('brand')"
                   class="h-9 px-4 rounded-lg border border-surface-2 text-[9px] font-black uppercase tracking-widest transition-all">
              Marque
            </button>
            <button (click)="toggleColumn('supplier')" 
                   [class.bg-primary]="visibleColumns().has('supplier')"
                   [class.text-white]="visibleColumns().has('supplier')"
                   class="h-9 px-4 rounded-lg border border-surface-2 text-[9px] font-black uppercase tracking-widest transition-all">
              Vendeur
            </button>
          </div>
        </div>

        <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-[#fafbfc] border-b border-[#e4e6ea]">
                <tr>
                  <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Produit</th>
                  <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Prix Market</th>
                  <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Stock & Alerte</th>
                  <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Catégorie</th>
                  @if (visibleColumns().has('brand')) {
                    <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Marque</th>
                  }
                  @if (visibleColumns().has('supplier')) {
                    <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Sourcing</th>
                  }
                  <th class="px-8 py-5 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#f5f6f8]">
                 @if (pagedProducts().length === 0) {
                   <tr><td colspan="7" class="px-8 py-16 text-center text-[11px] font-black text-[#9699a8] italic uppercase tracking-widest">Aucun produit ne correspond à votre recherche...</td></tr>
                 }
                 @for (product of pagedProducts(); track product.id) {
                   <tr class="hover:bg-[#fafbfc] transition-all group">
                     <td class="px-8 py-5">
                        <div class="flex items-center gap-4">
                           @if (product.imageUrl) {
                              <div class="relative">
                                 <img [src]="product.imageUrl" alt="Product" class="w-12 h-12 rounded-xl object-cover bg-surface-2 border border-surface-2">
                                 @if (asNumber(product.retailPrice) > asNumber(product.price)) {
                                    <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                                 }
                              </div>
                           } @else {
                              <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-400 flex items-center justify-center"><mat-icon class="scale-75">image</mat-icon></div>
                           }
                           <div>
                              <div class="text-xs font-black text-[#0D1B2A]">{{product.name}}</div>
                              <div class="flex items-center gap-2">
                                <div class="text-[9px] text-[#9699a8] font-bold italic">{{product.id.slice(-8)}}</div>
                                @if (product.supplierRef) {
                                  <div class="text-[8px] bg-navy/5 text-navy px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Ref: {{product.supplierRef}}</div>
                                }
                              </div>
                           </div>
                        </div>
                     </td>
                     <td class="px-8 py-5">
                        <div class="flex flex-col">
                          <span class="text-xs font-black text-[#0D1B2A] font-price">{{formatAmount(product.price)}} F</span>
                          @if (product.retailPrice) {
                             <span class="text-[9px] text-[#9699a8] font-bold line-through opacity-50">{{formatAmount(product.retailPrice)}} F</span>
                          }
                        </div>
                     </td>
                      <td class="px-8 py-5">
                        <div class="flex flex-col gap-2 min-w-[120px]">
                          <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black" 
                                  [class.text-red-600]="product.stock < (product.threshold || 5)"
                                  [class.text-emerald-600]="product.stock >= (product.threshold || 5)">
                               {{product.stock}} {{product.unit || 'U'}}
                            </span>
                            <span class="text-[8px] font-black text-muted uppercase tracking-tighter">Seuil: {{product.threshold || 5}}</span>
                          </div>
                          <!-- Stock Progress Bar -->
                          <div class="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                            <div class="h-full transition-all duration-500"
                                 [style.width.%]="getStockPercentage(product)"
                                 [class.bg-red-500]="product.stock < (product.threshold || 5)"
                                 [class.bg-orange-400]="product.stock >= (product.threshold || 5) && product.stock < (product.threshold || 5) * 2"
                                 [class.bg-emerald-500]="product.stock >= (product.threshold || 5) * 2">
                            </div>
                          </div>
                        </div>
                      </td>
                     <td class="px-8 py-5">
                        <span class="px-2 py-0.5 rounded-md bg-[#f0f2f5] text-[#5a5e72] text-[8px] font-black uppercase tracking-widest">{{product.category || 'Général'}}</span>
                     </td>
                     @if (visibleColumns().has('brand')) {
                       <td class="px-8 py-5">
                          <span class="text-[10px] font-bold text-navy italic">{{product.brand || "N/A"}}</span>
                       </td>
                     }
                     @if (visibleColumns().has('supplier')) {
                       <td class="px-8 py-5">
                          <div class="flex flex-col">
                             <span class="text-[10px] text-navy font-bold">{{product.supplierName || "Vendeur O'CHAP"}}</span>
                             <span class="text-[8px] text-[#9699a8] font-medium tracking-tighter">{{product.supplierId?.slice(-8)}}</span>
                          </div>
                       </td>
                     }
                     <td class="px-8 py-5">
                        <div class="flex items-center justify-end gap-2">
                          <a [routerLink]="['/products', product.id]" class="w-9 h-9 rounded-xl flex items-center justify-center text-[#9699a8] hover:bg-navy hover:text-white transition-all shadow-sm">
                             <mat-icon class="scale-75">visibility</mat-icon>
                          </a>
                          <button (click)="openEditModal(product)" class="w-9 h-9 rounded-xl flex items-center justify-center text-[#9699a8] hover:bg-primary hover:text-white transition-all shadow-sm">
                            <mat-icon class="scale-75">edit</mat-icon>
                          </button>
                          <button (click)="deleteProduct(product)" class="w-9 h-9 rounded-xl flex items-center justify-center text-red-300 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                            <mat-icon class="scale-75">delete_outline</mat-icon>
                          </button>
                        </div>
                     </td>
                   </tr>
                 }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-8 py-6 bg-[#fafbfc] border-t border-[#e4e6ea] flex items-center justify-between">
            <p class="text-[10px] font-black text-muted uppercase tracking-widest">
              Affichage de {{pagedProducts().length}} sur {{filteredProducts().length}} articles
            </p>
            <div class="flex items-center gap-2">
              <button (click)="prevPage()" [disabled]="currentPage() === 1" 
                      class="w-10 h-10 rounded-xl border border-surface-2 flex items-center justify-center text-muted disabled:opacity-20 hover:bg-white transition-all">
                <mat-icon class="scale-75">chevron_left</mat-icon>
              </button>
              @for (p of [].constructor(totalPages()); track $index) {
                <button (click)="currentPage.set($index + 1)" 
                        [class.bg-primary]="$index + 1 === currentPage()"
                        [class.text-white]="$index + 1 === currentPage()"
                        [class.border-primary]="$index + 1 === currentPage()"
                        class="w-10 h-10 rounded-xl border border-surface-2 text-[10px] font-black transition-all hover:bg-white">
                  {{$index + 1}}
                </button>
              }
              <button (click)="nextPage()" [disabled]="currentPage() === totalPages()"
                      class="w-10 h-10 rounded-xl border border-surface-2 flex items-center justify-center text-muted disabled:opacity-20 hover:bg-white transition-all">
                <mat-icon class="scale-75">chevron_right</mat-icon>
              </button>
            </div>
          </div>
        </div>
      } @else if (activeTab() === 'categories') {
        <!-- Category Management Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div class="bg-white p-10 rounded-[2.5rem] border border-surface-2 shadow-sm space-y-8">
            <div>
              <h3 class="text-xl font-black text-navy tracking-tight">Nouvelle Catégorie</h3>
              <p class="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Organisez votre catalogue par univers</p>
            </div>

            <div class="space-y-4">
               <div>
                  <label for="newCatName" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Désignation de la catégorie</label>
                  <input id="newCatName" type="text" [(ngModel)]="newCategoryName" placeholder="Ex: Informatique, Mobilité..." class="w-full h-12 bg-surface-2 rounded-xl px-4 text-sm font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
               </div>
               <button (click)="addCategory()" class="w-full h-12 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-navy transition-all active:scale-95">
                 Enregistrer la Catégorie
               </button>
            </div>
          </div>

          <div class="bg-white p-10 rounded-[2.5rem] border border-surface-2 shadow-sm space-y-8">
            <div>
              <h3 class="text-xl font-black text-navy tracking-tight">Catégories Actives</h3>
              <p class="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Liste des segments marketplace</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              @for (cat of dataService.categories$(); track cat.id) {
                <div class="bg-surface-2 p-4 rounded-2xl flex items-center justify-between group">
                  <span class="text-xs font-black text-navy uppercase tracking-widest">{{cat.name}}</span>
                  <button (click)="deleteCategory(cat.id)" class="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                    <mat-icon class="scale-75">delete_outline</mat-icon>
                  </button>
                </div>
              }
              @if (dataService.categories$().length === 0) {
                <div class="col-span-full py-12 text-center">
                   <mat-icon class="text-surface-3 scale-[2] mb-4">category</mat-icon>
                   <p class="text-[10px] font-black text-muted uppercase tracking-widest">Aucune catégorie définie</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Add/Edit Dynamic Progressive Modal -->
      @if (showModal()) {
         <div class="fixed inset-0 z-[3000] flex items-center justify-end">
            <div class="absolute inset-0 bg-dark/60 backdrop-blur-sm animate-fade-in" 
                 (click)="closeModal()" (keydown.escape)="closeModal()" tabindex="0" role="button" aria-label="Fermer le modal"></div>
            
            <div class="relative bg-white h-screen w-full max-w-2xl shadow-2xl flex flex-col animate-slide-left">
               <!-- Modal Header -->
               <div class="px-8 py-6 border-b border-surface-2 flex items-center justify-between bg-surface-3">
                  <div>
                     <h3 class="text-xl font-black text-navy tracking-tight">{{isEditing() ? "Modifier l'Article" : "Nouveau Produit Sourcing"}}</h3>
                     <p class="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Espace Administratif O'CHAP</p>
                  </div>
                  <button (click)="closeModal()" class="w-10 h-10 rounded-full hover:bg-surface-2 flex items-center justify-center text-muted">
                     <mat-icon>close</mat-icon>
                  </button>
               </div>

               <!-- Multi-Step Indicator -->
               <div class="px-8 py-4 bg-surface-2 border-b border-surface-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                  @for (step of steps; track step.index) {
                     <div class="flex items-center gap-2 group shrink-0">
                        <div class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all"
                             [class.bg-primary]="currentStep() === step.index"
                             [class.text-white]="currentStep() === step.index"
                             [class.bg-emerald-500]="currentStep() > step.index"
                             [class.text-white]="currentStep() > step.index"
                             [class.bg-white]="currentStep() < step.index"
                             [class.text-muted]="currentStep() < step.index">
                           @if (currentStep() > step.index) { <mat-icon class="scale-50">check</mat-icon> }
                           @else { {{step.index}} }
                        </div>
                        <span class="text-[9px] font-black uppercase tracking-widest transition-colors"
                              [class.text-navy]="currentStep() === step.index"
                              [class.text-emerald-600]="currentStep() > step.index"
                              [class.text-muted]="currentStep() < step.index">
                           {{step.label}}
                        </span>
                        @if (!$last) { <div class="w-4 h-px bg-surface-3"></div> }
                     </div>
                  }
               </div>

               <!-- Modal Body (Progressive Sections) -->
               <div class="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-white">
                  
                  <!-- Step 1: Identité & Sourcing -->
                  @if (currentStep() === 1) {
                     <div class="space-y-6 animate-fade-up">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div class="col-span-full">
                              <label for="prodName" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Désignation de l'article *</label>
                              <input id="prodName" type="text" [(ngModel)]="formData.name" placeholder="Ex: Congélateur SMART O'CHAP Double Porte" class="w-full h-12 bg-surface-2 rounded-xl px-4 text-sm font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                           </div>
                           
                           <div>
                              <label for="prodCat" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Catégorie Marketplace</label>
                              <select id="prodCat" [(ngModel)]="formData.category" class="w-full h-12 bg-surface-2 rounded-xl px-4 text-xs font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none cursor-pointer">
                                 <option value="Général">Général</option>
                                 @for (cat of dataService.categories$(); track cat.id) {
                                   <option [value]="cat.name">{{cat.name}}</option>
                                 }
                              </select>
                           </div>

                           <div>
                              <label for="prodBrand" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Marque / Gamme</label>
                              <input id="prodBrand" type="text" [(ngModel)]="formData.brand" placeholder="Ex: O'CHAP Premium" class="w-full h-12 bg-surface-2 rounded-xl px-4 text-sm font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                           </div>

                           <div>
                              <label for="prodSupplierRef" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Référence Fournisseur (Opt)</label>
                              <input id="prodSupplierRef" type="text" [(ngModel)]="formData.supplierRef" placeholder="Ex: REF-990-22" class="w-full h-12 bg-surface-2 rounded-xl px-4 text-sm font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                           </div>

                           <div class="col-span-full">
                              <label for="prodSupplier" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Sourcing Boutique (Fournisseur) *</label>
                              <select id="prodSupplier" [(ngModel)]="formData.supplierId" (change)="onSupplierChange($event)" class="w-full h-12 bg-navy text-white rounded-xl px-4 text-xs font-bold border-2 border-transparent focus:border-primary outline-none cursor-pointer">
                                 <option [value]="undefined">Sélectionner un tiers...</option>
                                 @for (s of dataService.suppliers$(); track s.id) {
                                    <option [value]="s.id">{{ s.name || s.displayName }}</option>
                                 }
                              </select>
                           </div>
                        </div>
                     </div>
                  }

                  <!-- Step 2: Valeurs & Stocks -->
                  @if (currentStep() === 2) {
                     <div class="space-y-6 animate-fade-up">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label for="prodPrice" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Prix de Vente Market (FCFA) *</label>
                              <div class="relative">
                                 <input id="prodPrice" type="number" min="0" (keypress)="preventNegative($event)" (input)="onFieldInput('price')" [(ngModel)]="formData.price" 
                                        [class.border-red-500]="formData.price < 0" [class.focus:border-red-500]="formData.price < 0"
                                        class="w-full h-12 bg-surface-2 rounded-xl px-4 text-lg font-black font-price border-2 border-transparent focus:border-primary focus:bg-white outline-none">
                                 <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted">FCFA</span>
                              </div>
                              @if (formData.price < 0) {
                                 <p class="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-fade-in">
                                    <mat-icon class="scale-50 !h-4 !w-4">warning</mat-icon> Le prix de vente ne doit pas être négatif.
                                 </p>
                              }
                           </div>
                           <div>
                              <label for="prodRetail" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Prix au Détail (Promo Ref)</label>
                              <div class="relative">
                                 <input id="prodRetail" type="number" min="0" (keypress)="preventNegative($event)" (input)="onFieldInput('retailPrice')" [(ngModel)]="formData.retailPrice" 
                                        [class.border-red-500]="formData.retailPrice < 0" [class.focus:border-red-500]="formData.retailPrice < 0"
                                        class="w-full h-12 bg-surface-2 rounded-xl px-4 text-lg font-black font-price border-2 border-transparent focus:border-primary focus:bg-white outline-none">
                                 <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted">FCFA</span>
                              </div>
                              @if (formData.retailPrice < 0) {
                                 <p class="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-fade-in">
                                    <mat-icon class="scale-50 !h-4 !w-4">warning</mat-icon> Le prix de détail ne doit pas être négatif.
                                 </p>
                              }
                           </div>
                           <div>
                              <label for="prodStock" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Stock Disponible</label>
                              <input id="prodStock" type="number" min="0" (keypress)="preventNegative($event)" (input)="onFieldInput('stock')" [(ngModel)]="formData.stock" 
                                     [class.border-red-500]="formData.stock < 0" [class.focus:border-red-500]="formData.stock < 0"
                                     class="w-full h-12 bg-surface-2 rounded-xl px-4 text-sm font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none">
                              @if (formData.stock < 0) {
                                 <p class="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-fade-in">
                                    <mat-icon class="scale-50 !h-4 !w-4">warning</mat-icon> Le stock disponible ne doit pas être négatif.
                                 </p>
                              }
                           </div>
                           <div>
                              <label for="prodThreshold" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Seuil d'Alerte</label>
                              <input id="prodThreshold" type="number" min="0" (keypress)="preventNegative($event)" (input)="onFieldInput('threshold')" [(ngModel)]="formData.threshold" 
                                     [class.border-red-500]="formData.threshold < 0" [class.focus:border-red-500]="formData.threshold < 0"
                                     class="w-full h-12 bg-surface-2 rounded-xl px-4 text-sm font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none">
                              @if (formData.threshold < 0) {
                                 <p class="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 animate-fade-in">
                                    <mat-icon class="scale-50 !h-4 !w-4">warning</mat-icon> Le seuil d'alerte ne doit pas être négatif.
                                 </p>
                              }
                           </div>
                           <div>
                              <label for="prodUnit" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Unité de mesure</label>
                              <select id="prodUnit" [(ngModel)]="formData.unit" class="w-full h-12 bg-surface-2 rounded-xl px-4 text-xs font-bold border-2 border-transparent focus:border-primary focus:bg-white outline-none">
                                 <option value="Unité">Pièce / Unité</option>
                                 <option value="Carton">Carton</option>
                                 <option value="Lot">Lot / Pack</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  }

                  <!-- Step 3: Multimedia & Présentation -->
                  @if (currentStep() === 3) {
                     <div class="space-y-8 animate-fade-up">
                        <div>
                           <span id="mainImageLabel" class="text-[10px] font-black text-muted uppercase tracking-widest mb-4 block text-center">Image Principale & Edition</span>
                           
                           <!-- Drag & Drop / Upload Area -->
                           <div class="w-full aspect-video bg-surface-2 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-all"
                                [class.border-primary]="isDragging()"
                                [class.bg-blue-50]="isDragging()"
                                [class.border-surface-3]="!isDragging()"
                                (dragover)="$event.preventDefault(); isDragging.set(true)"
                                (dragleave)="isDragging.set(false)"
                                (drop)="onFileDropped($event)"
                                aria-labelledby="mainImageLabel">
                              
                              @if (formData.imageUrl) {
                                 <img [src]="formData.imageUrl" class="w-full h-full object-cover" alt="Image principale du produit">
                                 <div class="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all backdrop-blur-sm">
                                    <button (click)="startCropping(formData.imageUrl)" class="bg-primary text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform" aria-label="Recadrer l'image">
                                       <mat-icon>crop</mat-icon>
                                    </button>
                                    <button (click)="formData.imageUrl = ''" class="bg-red-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform" aria-label="Supprimer l'image">
                                       <mat-icon>delete</mat-icon>
                                    </button>
                                 </div>
                              } @else {
                                 <mat-icon class="text-surface-3 scale-[3] mb-4">cloud_upload</mat-icon>
                                 <p class="text-[10px] font-black text-muted mb-4 uppercase">Glisser & déposer (plusieurs possibles) ou cliquez</p>
                                 <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" multiple class="hidden" aria-label="Uploader une image">
                                 <button (click)="fileInput.click()" class="h-9 px-6 rounded-lg bg-white border border-surface-3 text-[10px] font-black text-navy uppercase shadow-sm">Parcourir l'appareil</button>
                                 <div class="mt-4 flex items-center gap-2">
                                    <span class="text-[8px] font-bold text-muted uppercase">Ou URL :</span>
                                    <input type="text" [(ngModel)]="formData.imageUrl" placeholder="https://..." class="h-8 bg-white rounded-lg px-3 text-[9px] font-bold border border-surface-2 outline-none w-48" aria-label="URL de l'image">
                                 </div>
                              }

                              <!-- Multi-upload progress overlays -->
                              @if (uploadQueue().length > 0) {
                                <div class="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 space-y-4">
                                   <h5 class="text-xs font-black text-navy uppercase tracking-widest">Traitement des fichiers ({{uploadQueue().length}})</h5>
                                   <div class="w-full max-w-xs space-y-3">
                                      @for (item of uploadQueue(); track item.name) {
                                         <div class="space-y-1">
                                            <div class="flex items-center justify-between text-[8px] font-black uppercase text-muted">
                                               <span class="truncate max-w-[120px]">{{item.name}}</span>
                                               <span>{{item.progress}}%</span>
                                            </div>
                                            <div class="h-1 bg-surface-2 rounded-full overflow-hidden">
                                               <div class="h-full bg-primary transition-all duration-300" [style.width.%]="item.progress"></div>
                                            </div>
                                         </div>
                                      }
                                   </div>
                                </div>
                              }
                           </div>
                        </div>

                        <!-- Gallery Multi-Upload -->
                        <div>
                           <div class="flex items-center justify-between mb-4">
                              <span id="galleryLabel" class="text-[10px] font-black text-muted uppercase tracking-widest block">Galerie de Présentation</span>
                              <button (click)="galleryInput.click()" class="text-[9px] font-black uppercase text-primary border border-primary/20 px-3 py-1 rounded-lg hover:bg-primary/10 flex items-center gap-1">
                                 <mat-icon class="scale-50">add</mat-icon> Ajouter Images
                              </button>
                              <input type="file" #galleryInput (change)="onGallerySelected($event)" multiple accept="image/*" class="hidden" aria-label="Uploader des images pour la galerie">
                           </div>
                           
                           <div class="grid grid-cols-4 sm:grid-cols-6 gap-3" aria-labelledby="galleryLabel">
                              @for (url of galleryList(); track url; let i = $index) {
                                 <div class="aspect-square relative rounded-xl overflow-hidden group border border-surface-2 bg-surface-2">
                                    <img [src]="url" class="w-full h-full object-cover" [alt]="'Image galerie ' + (i + 1)">
                                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                       <button (click)="removeGalleryImage(i)" class="text-white bg-red-500 rounded-full p-1 shadow-lg" [aria-label]="'Supprimer image ' + (i + 1)"><mat-icon class="scale-50">close</mat-icon></button>
                                    </div>
                                    <div class="absolute bottom-1 left-1 bg-white/80 rounded px-1 text-[8px] font-bold">{{i+1}}</div>
                                 </div>
                              }
                              @if (galleryList().length === 0) {
                                 @for (x of [1,2,3,4]; track x) {
                                    <div class="aspect-square rounded-xl bg-surface-2 border-2 border-dashed border-surface-3 flex items-center justify-center text-surface-3 opacity-30">
                                       <mat-icon class="scale-50">image</mat-icon>
                                    </div>
                                 }
                              }
                           </div>
                           <p class="text-[8px] font-bold text-muted mt-2 italic">* Cliquez pour ajouter des visuels sous différents angles.</p>
                        </div>
                     </div>
                  }

                  <!-- Step 4: Intelligence & Détails -->
                  @if (currentStep() === 4) {
                     <div class="space-y-6 animate-fade-up">
                        <div class="group relative">
                           <label for="prodDesc" class="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block flex items-center justify-between">
                              Description Narratrice Marketplace
                              <button (click)="generateAIDescription()" [disabled]="generatingAI()" class="text-[9px] font-black text-indigo-500 flex items-center gap-1 hover:underline">
                                 <mat-icon class="scale-50">{{ generatingAI() ? 'refresh' : 'auto_awesome' }}</mat-icon>
                                 {{ generatingAI() ? 'Génération...' : 'Inspiration IA' }}
                              </button>
                           </label>
                           <textarea id="prodDesc" [(ngModel)]="formData.description" rows="5" placeholder="Décrivez l'innovation technique..." class="w-full bg-surface-2 rounded-xl p-4 text-sm font-medium border-2 border-transparent focus:border-primary focus:bg-white outline-none"></textarea>
                        </div>

                        <div>
                           <div class="flex items-center justify-between mb-4">
                              <p id="specLabel" class="text-[10px] font-black text-muted uppercase tracking-widest block">Fiche Technique Dynamique</p>
                              <button (click)="addSpec()" class="text-[9px] font-black uppercase text-primary border border-primary/20 px-3 py-1 rounded-lg hover:bg-primary/10">Ajouter Attribut</button>
                           </div>
                           
                           <div class="space-y-2" aria-labelledby="specLabel">
                              @for (spec of specs(); track $index) {
                                 <div class="flex items-center gap-2">
                                    <input [(ngModel)]="spec.key" aria-label="Clé de l'attribut" placeholder="Ex: Puissance" class="flex-1 h-10 bg-surface-2 rounded-lg px-3 text-[11px] font-bold outline-none">
                                    <input [(ngModel)]="spec.value" aria-label="Valeur de l'attribut" placeholder="Ex: 2000W" class="flex-1 h-10 bg-surface-2 rounded-lg px-3 text-[11px] font-bold outline-none">
                                    <button (click)="removeSpec($index)" class="w-10 h-10 text-red-400 hover:bg-red-50 rounded-lg" aria-label="Supprimer cet attribut"><mat-icon class="scale-75" aria-hidden="true">delete</mat-icon></button>
                                 </div>
                              }
                           </div>
                        </div>
                     </div>
                  }

               </div>

               <!-- Modal Footer -->
               <div class="px-8 py-6 border-t border-surface-2 bg-white flex items-center justify-between">
                  <button (click)="prevStep()" [disabled]="currentStep() === 1" class="h-12 px-6 rounded-xl border border-surface-2 text-navy text-[11px] font-bold uppercase tracking-widest disabled:opacity-20 transition-all active:scale-95">Retour</button>
                  
                  <div class="flex items-center gap-3">
                     <button (click)="closeModal()" class="h-12 px-6 rounded-xl text-muted text-[11px] font-bold uppercase tracking-widest hover:bg-surface-2">Annuler</button>
                     
                     @if (currentStep() < 4) {
                        <button (click)="nextStep()" [disabled]="currentStep() === 2 && hasNegativeValues()" class="h-12 px-8 bg-navy text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-navy/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">Continuer</button>
                     } @else {
                        <button (click)="saveProduct()" [disabled]="saving() || hasNegativeValues()" class="h-12 px-8 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-95 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                           @if (saving()) { <mat-icon class="animate-spin scale-75">refresh</mat-icon> }
                           {{ isEditing() ? "Appliquer Changements" : "Publier l'Article" }}
                        </button>
                     }
                  </div>
               </div>
            </div>
         </div>
      }

      <!-- Custom Delete Confirmation Modal -->
      @if (productToDelete()) {
         <div class="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-dark/60 backdrop-blur-sm animate-fade-in" 
                 (click)="productToDelete.set(null)" (keydown.escape)="productToDelete.set(null)" tabindex="0" role="button" aria-label="Annuler la suppression"></div>
            
            <div class="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl p-8 flex flex-col space-y-6 animate-fade-up">
               <div class="flex items-center gap-4 text-red-500">
                  <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                     <mat-icon class="scale-125">warning</mat-icon>
                  </div>
                  <div>
                     <h3 class="text-lg font-black text-navy tracking-tight">Confirmer la suppression</h3>
                     <p class="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Cette action est irréversible</p>
                  </div>
               </div>
               
               <p class="text-xs text-navy font-medium leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer définitivement le produit <span class="font-bold text-red-600">"{{productToDelete()?.name}}"</span> ? Toutes les données associées seront définitivement effacées du catalogue.
               </p>

               <div class="flex items-center justify-end gap-3 self-end w-full">
                  <button (click)="productToDelete.set(null)" class="h-11 px-5 rounded-xl border border-surface-2 text-navy text-[10px] font-black uppercase tracking-widest hover:bg-surface-2 transition-all">
                     Annuler
                  </button>
                  <button (click)="confirmProductDeletion()" class="h-11 px-5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                     <mat-icon class="scale-75">delete_forever</mat-icon> Supprimer
                  </button>
               </div>
            </div>
         </div>
      }

      <!-- Image Editor Overlay -->
      @if (croppingImage()) {
         <div class="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-dark/95 backdrop-blur-xl animate-fade-in" 
                 (click)="croppingImage.set('')"
                 (keydown.escape)="croppingImage.set('')"
                 tabindex="0" role="button" aria-label="Fermer l'éditeur"></div>
            
            <div class="relative bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-fade-up">
               <div class="px-8 py-6 border-b border-surface-2 flex items-center justify-between">
                  <div>
                     <h3 class="text-lg font-black text-navy uppercase tracking-widest">Éditeur d'Image</h3>
                     <p class="text-[9px] font-bold text-muted italic">Ajustez, recadrez et pivotez votre visuel produit</p>
                  </div>
                  <div class="flex items-center gap-2">
                     <button (click)="rotateLeft()" class="w-10 h-10 rounded-xl bg-surface-2 text-navy hover:bg-primary hover:text-white transition-all"><mat-icon class="scale-75">rotate_left</mat-icon></button>
                     <button (click)="rotateRight()" class="w-10 h-10 rounded-xl bg-surface-2 text-navy hover:bg-primary hover:text-white transition-all"><mat-icon class="scale-75">rotate_right</mat-icon></button>
                  </div>
               </div>

               <div class="flex-1 bg-surface-3 relative overflow-hidden">
                  <image-cropper
                     [imageBase64]="croppingImage()"
                     [maintainAspectRatio]="true"
                     [aspectRatio]="16 / 9"
                     [transform]="transform"
                     format="png"
                     (imageCropped)="imageCropped($event)"
                     (imageLoaded)="imageLoaded()"
                     (cropperReady)="cropperReady()"
                     (loadImageFailed)="loadImageFailed()"
                     style="height: 100%; max-height: 100%"
                  ></image-cropper>
               </div>

               <div class="px-8 py-6 border-t border-surface-2 bg-surface-2 flex items-center justify-between">
                  <button (click)="croppingImage.set('')" class="h-12 px-6 rounded-xl border border-surface-3 text-muted text-[11px] font-bold uppercase tracking-widest">Abandonner</button>
                  <button (click)="applyCrop()" class="h-12 px-10 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-95">Appliquer & Sauvegarder</button>
               </div>
            </div>
         </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-fade-up { animation: fadeUp 0.5s ease-out; }
    .animate-slide-left { animation: slideLeft 0.5s cubic-bezier(0, 0, 0.2, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideLeft { 
       from { transform: translateX(100%); }
       to { transform: translateX(0); }
    }
  `]
})
export class AdminProducts implements OnInit, OnDestroy {
  public dataService = inject(DataService);
  private subscriptions: (() => void)[] = [];

  ngOnInit() {
    this.subscriptions.push(this.dataService.watchAllProducts());
    this.subscriptions.push(this.dataService.watchAllUsers()); // Includes suppliers
  }

  ngOnDestroy() {
    this.subscriptions.forEach(unsub => unsub());
  }

  activeTab = signal<'products' | 'categories'>('products');
  showModal = signal(false);
  isEditing = signal(false);
  currentStep = signal(1);
  saving = signal(false);
  
  // AI & Image Stats
  analyzingAI = signal(false);
  generatingAI = signal(false);
  aiReport = signal('');
  today = new Date();
  
  // Image Editing
  croppingImage = signal<string>('');
  croppedImageBase64 = '';
  transform = { scale: 1, rotate: 0, flipH: false, flipV: false };
  isDragging = signal(false);
  galleryList = signal<string[]>([]);
  uploadQueue = signal<{name: string, progress: number}[]>([]);
  showLowStockOnly = signal(false);
  productToDelete = signal<OchapProduct | null>(null);
  
  // Filtering & Sorting
  searchQuery = '';
  selectedCategoryFilter = '';
  sortBy = 'name';
  currentPage = signal(1);
  pageSize = 10;
  visibleColumns = signal<Set<string>>(new Set(['brand', 'supplier']));

  // Category Management
  newCategoryName = '';

  formData = {
    id: '',
    name: '',
    price: 0,
    retailPrice: 0,
    category: 'Général',
    stock: 0,
    threshold: 5,
    unit: 'Unité',
    brand: '',
    supplierRef: '',
    imageUrl: '',
    galleryUrls: [] as string[],
    description: '',
    supplierId: '',
    supplierName: '',
    technicalSpecs: ''
  };

  specs = signal<{key: string, value: string}[]>([]);

  steps = [
    { index: 1, label: 'Identité' },
    { index: 2, label: 'Prix & Stock' },
    { index: 3, label: 'Médias' },
    { index: 4, label: 'Data Specs' }
  ];

  lowStockCount = this.dataService.lowStockCount;

  // Derived filtered and sorted products
  filteredProducts = computed(() => {
    let list = [...this.dataService.products$()];
    
    if (this.showLowStockOnly()) {
      list = list.filter(p => p.stock < (p.threshold || 5));
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }

    if (this.selectedCategoryFilter) {
      list = list.filter(p => p.category === this.selectedCategoryFilter);
    }

    // Sort
    list.sort((a, b) => {
      switch (this.sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'stock_asc': return a.stock - b.stock;
        case 'stock_desc': return b.stock - a.stock;
        case 'name':
        default: return a.name.localeCompare(b.name);
      }
    });

    return list;
  });

  pagedProducts = computed(() => {
    const list = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.pageSize) || 1);

  getStockPercentage(p: OchapProduct): number {
    const threshold = p.threshold || 5;
    const percentage = (p.stock / (threshold * 3)) * 100;
    return Math.min(percentage, 100);
  }

  toggleColumn(col: string) {
    this.visibleColumns.update(set => {
      const newSet = new Set(set);
      if (newSet.has(col)) newSet.delete(col);
      else newSet.add(col);
      return newSet;
    });
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  // --- AI ACTIONS ---
  async analyzeInventoryAI() {
    this.analyzingAI.set(true);
    try {
      const report = await this.dataService.analyzeInventoryPerformance();
      this.aiReport.set(report);
    } finally {
      this.analyzingAI.set(false);
    }
  }

  async generateAIDescription() {
    if (!this.formData.name) return;
    this.generatingAI.set(true);
    try {
      const desc = await this.dataService.generateDescription(this.formData.name, this.formData.category);
      this.formData.description = desc;
    } finally {
      this.generatingAI.set(false);
    }
  }

  // --- IMAGE ACTIONS ---
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.processUploads(Array.from(files));
    }
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processUploads(Array.from(files));
    }
  }

  private async processUploads(files: File[]) {
    // Show queue
    this.uploadQueue.set(files.map(f => ({ name: f.name, progress: 0 })));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Simulate progress for better UX as requested
      for (let p = 0; p <= 100; p += 10) {
        this.uploadQueue.update(q => {
          const newQ = [...q];
          if (newQ[i]) newQ[i].progress = p;
          return newQ;
        });
        await new Promise(r => setTimeout(r, 100)); // Smooth animation
      }

      const reader = new FileReader();
      const result = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      if (i === 0 && !this.formData.imageUrl) {
        this.formData.imageUrl = result;
      } else {
        this.galleryList.update(list => [...list, result]);
      }
    }

    // Clear queue after a small delay
    setTimeout(() => this.uploadQueue.set([]), 500);
  }

  private readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.croppingImage.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  onGallerySelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const res = e.target?.result;
          if (typeof res === 'string') {
            this.galleryList.update(list => [...list, res]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeGalleryImage(idx: number) {
    this.galleryList.update(list => list.filter((_, i) => i !== idx));
  }

  startCropping(url: string) {
    this.croppingImage.set(url);
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImageBase64 = event.base64 || '';
  }

  asNumber(val: unknown): number {
    return Number(val) || 0;
  }

  imageLoaded() { /* Readiness logic */ }
  cropperReady() { /* Readiness logic */ }
  loadImageFailed() { alert('Échec du chargement de l\'image.'); }

  rotateLeft() { this.transform = { ...this.transform, rotate: this.transform.rotate - 90 }; }
  rotateRight() { this.transform = { ...this.transform, rotate: this.transform.rotate + 90 }; }

  applyCrop() {
    if (this.croppedImageBase64) {
      this.formData.imageUrl = this.croppedImageBase64;
    }
    this.croppingImage.set('');
  }

  // Bulk Actions
  async clearAllProducts() {
    if (confirm('ATTENTION: Voulez-vous vraiment supprimer TOUS les articles du catalogue ? Cette action est irréversible.')) {
      await this.dataService.clearAllProducts();
    }
  }

  // Category Actions
  async addCategory() {
    if (!this.newCategoryName.trim()) return;
    await this.dataService.addCategory(this.newCategoryName.trim());
    this.newCategoryName = '';
  }

  async deleteCategory(id: string) {
    if (confirm('Supprimer cette catégorie ?')) {
      await this.dataService.deleteCategory(id);
    }
  }

  formatAmount(val: number | unknown): string {
    return this.dataService.formatAmount(val);
  }

  openAddModal() {
    this.resetForm();
    this.showModal.set(true);
    this.isEditing.set(false);
    this.currentStep.set(1);
  }

  openEditModal(p: OchapProduct) {
    this.formData = {
      id: p.id,
      name: p.name,
      price: p.price,
      retailPrice: p.retailPrice || 0,
      category: p.category || 'Général',
      stock: p.stock,
      threshold: p.threshold || 5,
      unit: p.unit || 'Unité',
      brand: p.brand || '',
      supplierRef: p.supplierRef || '',
      imageUrl: p.imageUrl || '',
      galleryUrls: p.galleryUrls || [],
      description: p.description || '',
      supplierId: p.supplierId || '',
      supplierName: p.supplierName || '',
      technicalSpecs: p.technicalSpecs || ''
    };
    
    this.galleryList.set(this.formData.galleryUrls);

    // Parse specs
    const specArray: {key: string, value: string}[] = [];
    try {
      const parsed = JSON.parse(p.technicalSpecs || '[]');
      if (Array.isArray(parsed)) {
         parsed.forEach(item => specArray.push(item));
      }
    } catch(error) {
      console.warn('Error parsing technical specs', error);
    }
    this.specs.set(specArray);

    this.showModal.set(true);
    this.isEditing.set(true);
    this.currentStep.set(1);
  }

  closeModal() {
    this.showModal.set(false);
  }

  preventNegative(event: KeyboardEvent) {
    if (event.key === '-' || event.key === 'e' || event.key === 'E' || event.key === '+') {
      event.preventDefault();
    }
  }

  onFieldInput(field: 'price' | 'retailPrice' | 'stock' | 'threshold') {
    if (this.formData[field] !== null && this.formData[field] !== undefined) {
      if (this.formData[field] < 0) {
        this.formData[field] = 0;
      }
    }
  }

  hasNegativeValues(): boolean {
    return (
      (this.formData.price || 0) < 0 ||
      (this.formData.retailPrice || 0) < 0 ||
      (this.formData.stock || 0) < 0 ||
      (this.formData.threshold || 0) < 0
    );
  }

  nextStep() {
    this.currentStep.update(s => s + 1);
  }

  prevStep() {
    this.currentStep.update(s => s - 1);
  }

  addSpec() {
    this.specs.update(s => [...s, { key: '', value: '' }]);
  }

  removeSpec(idx: number) {
    this.specs.update(s => s.filter((_, i) => i !== idx));
  }

  onSupplierChange(event: Event) {
    const sId = (event.target as HTMLSelectElement).value;
    const s = this.dataService.suppliers$().find(u => u.id === sId);
    if (s) {
       this.formData.supplierId = s.id;
       this.formData.supplierName = s.name || s.displayName || 'Vendeur';
    }
  }

  async saveProduct() {
     if (this.hasNegativeValues()) {
        alert('Erreur: Les valeurs de prix ou de stock ne peuvent pas être négatives.');
        return;
     }
     this.saving.set(true);
     
     // Serialize specs
     this.formData.technicalSpecs = JSON.stringify(this.specs().filter(s => s.key && s.value));
     this.formData.galleryUrls = this.galleryList();

     const data: Partial<OchapProduct> = { ...this.formData };
     delete data['id'];

     try {
        if (this.isEditing()) {
           await this.dataService.updateProduct(this.formData.id, data);
        } else {
           await this.dataService.addProduct(data);
        }
        this.closeModal();
     } catch (e) {
        alert('Erreur lors de la sauvegarde: ' + e);
     } finally {
        this.saving.set(false);
     }
  }

  deleteProduct(p: OchapProduct) {
     this.productToDelete.set(p);
  }

  async confirmProductDeletion() {
     const p = this.productToDelete();
     if (p) {
        await this.dataService.deleteProduct(p.id);
        this.productToDelete.set(null);
     }
  }

  private resetForm() {
    this.formData = {
      id: '',
      name: '',
      price: 0,
      retailPrice: 0,
      category: 'Général',
      stock: 0,
      threshold: 5,
      unit: 'Unité',
      brand: '',
      supplierRef: '',
      imageUrl: '',
      galleryUrls: [],
      description: '',
      supplierId: '',
      supplierName: '',
      technicalSpecs: ''
    };
    this.galleryList.set([]);
    this.specs.set([]);
  }
}
