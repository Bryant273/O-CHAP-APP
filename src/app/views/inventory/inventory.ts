import { ChangeDetectionStrategy, Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { auth, db } from '../../services/firebase';
import { onSnapshot, collection, query, where, Unsubscribe, QuerySnapshot, DocumentData, updateDoc, doc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { OchapProduct } from '../../services/data.service';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { animate, stagger } from 'motion';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink, ImageCropperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in px-4 py-8">
      <!-- HEADER EXECUTIVE -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 class="text-3xl font-black text-[#0D1B2A] tracking-tighter">Inventaire & Stock.</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium tracking-wide">Interface Fournisseur O'CHAP — Logistique Intelligente</p>
        </div>
        
        <div class="flex items-center gap-4">
           <div class="px-5 py-2.5 bg-emerald-50 border border-emerald-100/50 text-emerald-700 rounded-2xl text-[10px] font-black flex items-center gap-3 shadow-sm">
             <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             SYNCHRONISATION LIVE
           </div>
           <button (click)="openAddPanel()" class="bg-[#0D1B2A] text-white px-8 h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl shadow-navy/10 flex items-center gap-3 active:scale-95">
             <mat-icon class="scale-75">add</mat-icon>
             Ajouter un Article
           </button>
        </div>
      </div>

      <!-- KPIS RAPIDES -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
         <div class="bg-white p-7 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm hover:shadow-md transition-all">
            <div class="text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em] mb-2">Total Catalogue</div>
            <div class="text-3xl font-black text-[#0D1B2A]">{{products().length}} <span class="text-[10px] text-muted">SKUs</span></div>
         </div>
         <div class="bg-white p-7 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm hover:shadow-md transition-all">
            <div class="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-2">Rupture Stock</div>
            <div class="text-3xl font-black text-red-600">{{countOutOfStock()}}</div>
         </div>
         <div class="bg-white p-7 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm hover:shadow-md transition-all">
            <div class="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-2">Sous Seuil</div>
            <div class="text-3xl font-black text-orange-600">{{countLowStock()}}</div>
         </div>
         <div class="bg-white p-7 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm hover:shadow-md transition-all">
            <div class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Valeur Assets</div>
            <div class="text-3xl font-black text-emerald-600">{{calculateValue()}}M <span class="text-[10px] text-muted uppercase">CFA</span></div>
         </div>
      </div>

      <!-- FILTRES AVANCÉS -->
      <div class="flex flex-wrap items-center gap-4 py-4 bg-white/50 backdrop-blur-md sticky top-0 z-[100] border-b border-[#f0f2f5] mb-8">
         <button (click)="filterCat.set('all')" [class.bg-primary]="filterCat() === 'all'" [class.text-white]="filterCat() === 'all'" [class.shadow-lg]="filterCat() === 'all'" class="px-6 h-10 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#e4e6ea] hover:border-primary transition-all active:scale-90">Tous les flux</button>
         @for (cat of ['frigo', 'congel', 'tv', 'clim', 'laver', 'cuisine', 'micro', 'cafe', 'phone']; track cat) {
            <button (click)="filterCat.set(cat)" 
                    [class.bg-primary]="filterCat() === cat" 
                    [class.text-white]="filterCat() === cat" 
                    [class.shadow-lg]="filterCat() === cat"
                    class="px-6 h-10 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#e4e6ea] hover:border-primary transition-all active:scale-90">
              {{cat}}
            </button>
         }
         <div class="h-8 w-px bg-[#e4e6ea] mx-2"></div>
         <button (click)="showLowStockOnly.set(!showLowStockOnly())" 
                 [class.bg-orange-600]="showLowStockOnly()" 
                 [class.text-white]="showLowStockOnly()"
                 [class.shadow-xl]="showLowStockOnly()"
                 [class.shadow-orange-500/20]="showLowStockOnly()"
                 class="px-6 h-10 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-200 text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-2">
           <mat-icon class="scale-50">warning</mat-icon>
           Alertes Stock
         </button>

         <div class="flex-1"></div>
         <div class="relative w-full md:w-80 group">
           <mat-icon class="absolute left-5 top-1/2 -translate-y-1/2 text-[#9699a8] scale-75 group-focus-within:text-primary transition-colors">search</mat-icon>
           <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher par nom, marque ou réf..." class="w-full h-12 bg-white border border-[#e4e6ea] rounded-2xl pl-12 pr-6 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm">
         </div>
      </div>

      <!-- TABLE PROFESSIONNELLE HAUTE DENSITÉ -->
      <div class="bg-white rounded-[3rem] border border-[#e4e6ea] shadow-oc-sm overflow-hidden min-h-[500px]">
         <div class="overflow-x-auto no-scrollbar">
            <table class="w-full border-collapse">
               <thead>
                  <tr class="bg-[#fafbfc] border-b border-[#f0f2f5]">
                     <th class="px-10 py-6 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Article & Identité</th>
                     <th class="px-10 py-6 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Référence</th>
                     <th class="px-10 py-6 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Segment</th>
                     <th class="px-10 py-6 text-center text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Gestion Stock</th>
                     <th class="px-10 py-6 text-center text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Seuil</th>
                     <th class="px-10 py-6 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Prix (CFA)</th>
                     <th class="px-10 py-6 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Actions</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-[#f5f6f8]">
                  @for (product of filteredProducts(); track product.id) {
                     <tr class="hover:bg-[#fafbfc]/80 group transition-all duration-300">
                        <td class="px-10 py-5">
                           <div class="flex items-center gap-5">
                              <div class="w-14 h-14 rounded-2xl bg-[#fafbfc] p-2.5 overflow-hidden border border-[#f0f2f5] group-hover:scale-105 transition-all shadow-sm flex items-center justify-center">
                                 <img [src]="product.imageUrl" class="max-w-full max-h-full object-contain mix-blend-darken" referrerpolicy="no-referrer" [alt]="product.name">
                              </div>
                              <div>
                                 <div class="text-[13px] font-black text-[#0D1B2A] leading-tight">{{product.name}}</div>
                                 <div class="text-[10px] font-bold text-primary uppercase tracking-[0.1em] mt-0.5">{{product.brand || 'No Brand'}}</div>
                              </div>
                           </div>
                        </td>
                        <td class="px-10 py-5 text-[11px] font-bold text-[#5a5e72] font-mono tracking-tighter opacity-80">{{product.supplierRef || '---'}}</td>
                        <td class="px-10 py-5 uppercase">
                           <span class="px-3 py-1.5 rounded-xl bg-gray-50 text-[9px] font-black text-[#5a5e72] tracking-[0.1em] border border-[#e4e6ea]">
                              {{product.category}}
                           </span>
                        </td>
                        <td class="px-10 py-5">
                           <div class="flex flex-col items-center gap-2.5">
                              <div class="flex items-center bg-white border border-[#e4e6ea] rounded-xl overflow-hidden shadow-sm">
                                 <button (click)="updateQuickStock(product.id, (product.stock || 0) - 1, product.threshold || 10)" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-all text-[#5a5e72]">
                                    <mat-icon class="scale-50">remove</mat-icon>
                                 </button>
                                 <span class="w-10 text-center text-[11px] font-black" [class.text-red-600]="(product.stock || 0) <= (product.threshold || 0)">
                                    {{product.stock || 0}}
                                 </span>
                                 <button (click)="updateQuickStock(product.id, (product.stock || 0) + 1, product.threshold || 10)" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-all text-[#5a5e72]">
                                    <mat-icon class="scale-50">add</mat-icon>
                                 </button>
                              </div>
                              <div class="w-16 h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
                                 <div class="h-full transition-all duration-700" 
                                       [class.bg-red-500]="(product.stock || 0) <= (product.threshold || 0)"
                                       [class.bg-emerald-500]="(product.stock || 0) > (product.threshold || 0)"
                                       [style.width.%]="Math.min(((product.stock || 0) / (product.threshold || 10) * 50), 100)"></div>
                              </div>
                           </div>
                        </td>
                        <td class="px-10 py-5 text-center text-[11px] font-black text-[#5a5e72] opacity-60">{{product.threshold}}</td>
                        <td class="px-10 py-5 text-right text-[13px] font-black text-[#0D1B2A] font-price">{{product.price.toLocaleString()}} <span class="text-[9px] opacity-40">CFA</span></td>
                        <td class="px-10 py-5 text-right">
                           <div class="flex justify-end gap-2.5">
                              <button (click)="editProduct(product)" class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Modifier">
                                 <mat-icon class="scale-90">edit</mat-icon>
                              </button>
                              <button (click)="deleteProduct($event, product.id)" class="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Supprimer">
                                 <mat-icon class="scale-90">delete_outline</mat-icon>
                              </button>
                           </div>
                        </td>
                     </tr>
                  }
               </tbody>
            </table>
         </div>
         @if (filteredProducts().length === 0) {
            <div class="py-32 text-center flex flex-col items-center gap-6">
               <div class="w-24 h-24 rounded-[2.5rem] bg-[#f8f9fa] flex items-center justify-center text-[#d1d5db] animate-pulse">
                 <mat-icon class="scale-[2.5]">inventory_2</mat-icon>
               </div>
               <div>
                 <p class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-[0.25em]">Horizon Vide</p>
                 <p class="text-xs text-muted mt-2 max-w-xs mx-auto">Aucun article ne correspond à vos filtres actuels. Modifiez votre recherche ou ajoutez un nouveau produit.</p>
               </div>
            </div>
         }
      </div>

      <!-- MODAL ÉDITION PRODUIT -->
      @if (showAddPanel()) {
        <div class="fixed inset-0 z-[1000] flex justify-end">
          <div class="absolute inset-0 bg-[#0D1B2A]/60 backdrop-blur-md animate-fade-in" (click)="showAddPanel.set(false)"></div>
          
          <div class="relative w-full max-w-2xl bg-white h-full shadow-2xl animate-slide-left flex flex-col overflow-hidden rounded-l-[3rem] border-l border-[#e4e6ea]">
            <div class="flex items-center justify-between p-10 border-b border-[#f0f2f5] bg-white shrink-0">
               <div>
                  <h3 class="text-3xl font-black text-[#0D1B2A] tracking-tighter">{{ editing() ? 'Édition' : 'Création' }} Article.</h3>
                  <p class="text-[10px] font-black text-primary uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                    <mat-icon class="scale-50">auto_awesome</mat-icon> ÉDITEUR O'CHAP ENGINE
                  </p>
               </div>
               <button (click)="showAddPanel.set(false)" class="w-12 h-12 rounded-3xl hover:bg-[#f8f9fa] transition-all flex items-center justify-center text-ink" title="Fermer">
                 <mat-icon>close</mat-icon>
               </button>
            </div>

            <div class="flex-1 overflow-y-auto no-scrollbar p-10 space-y-10 bg-[#fafbfc]">
               <!-- IDENTITY & PRICING -->
               <div class="space-y-8 bg-white p-10 rounded-[3rem] border border-[#f0f2f5] shadow-sm animate-field">
                  <div class="grid grid-cols-2 gap-8">
                    <div class="col-span-full space-y-2.5 animate-field">
                      <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Désignation Commerciale</label>
                      <input type="text" [(ngModel)]="currentProd.name" placeholder="Ex: Réfrigérateur Combiné LG 400L" class="w-full h-14 bg-gray-50/50 border border-[#e4e6ea] rounded-2xl px-6 text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all">
                    </div>
                    
                    <div class="space-y-2.5 animate-field">
                      <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Marque Producteur</label>
                      <input type="text" [(ngModel)]="currentProd.brand" placeholder="Samsung, LG, Whirlpool..." class="w-full h-14 bg-gray-50/50 border border-[#e4e6ea] rounded-2xl px-6 text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all">
                    </div>
                    <div class="space-y-2.5 animate-field">
                      <div class="flex justify-between items-center ml-2">
                        <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Réf. Interne (SKU)</label>
                        @if (currentProd.supplierRef && !isSkuValid()) {
                          <span class="text-[9px] font-bold text-red-500 uppercase">Format : OCH-XXXX-X</span>
                        } @else {
                          <span class="text-[8px] font-bold text-emerald-600 uppercase">Auto-généré si vide</span>
                        }
                      </div>
                      <input type="text" 
                             [(ngModel)]="currentProd.supplierRef" 
                             (blur)="currentProd.supplierRef = (currentProd.supplierRef || '').trim().toUpperCase()"
                             placeholder="OCH-XXXX-X (Ex: OCH-7712-A)" 
                             [class.border-red-500]="currentProd.supplierRef && !isSkuValid()"
                             class="w-full h-14 bg-gray-50/50 border border-[#e4e6ea] rounded-2xl px-6 text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all font-mono">
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-8">
                     <div class="space-y-2.5 animate-field">
                       <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Prix Public (CFA)</label>
                       <input type="number" [(ngModel)]="currentProd.price" class="w-full h-14 bg-emerald-50/30 border border-emerald-100 rounded-2xl px-6 text-lg font-black focus:bg-white focus:border-emerald-500 outline-none transition-all text-emerald-600 font-price">
                     </div>
                     <div class="space-y-2.5 animate-field">
                       <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Catégorie</label>
                       <select [(ngModel)]="currentProd.category" class="w-full h-14 bg-gray-50/50 border border-[#e4e6ea] rounded-2xl px-6 text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all cursor-pointer">
                          <option value="frigo">Réfrigérateurs</option>
                          <option value="congel">Congélateurs</option>
                          <option value="tv">Téléviseurs</option>
                          <option value="clim">Climatiseurs</option>
                          <option value="laver">Lave-linge</option>
                          <option value="cuisine">Cuisinières</option>
                          <option value="micro">Micro-ondes</option>
                          <option value="cafe">Cafetières</option>
                          <option value="phone">Smartphones</option>
                       </select>
                     </div>
                  </div>

                  <div class="grid grid-cols-2 gap-8">
                     <div class="space-y-2.5 animate-field">
                       <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Stock Disponible</label>
                       <input type="number" [(ngModel)]="currentProd.stock" class="w-full h-14 bg-gray-50/50 border border-[#e4e6ea] rounded-2xl px-6 text-base font-black outline-none transition-all focus:bg-white">
                     </div>
                     <div class="space-y-2.5 animate-field">
                       <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Seuil de Réappro.</label>
                       <input type="number" [(ngModel)]="currentProd.threshold" class="w-full h-14 bg-orange-50/30 border border-orange-100 rounded-2xl px-6 text-base font-black outline-none transition-all focus:bg-white text-orange-600">
                     </div>
                  </div>
               </div>

               <!-- MEDIA COMMAND CENTER -->
               <div class="space-y-8 bg-white p-10 rounded-[3rem] border border-[#f0f2f5] shadow-sm animate-field">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Visuels Haute Résolution</p>
                      <p class="text-[9px] text-muted italic">Image principale & Galerie interactive</p>
                    </div>
                  </div>

                  <!-- Unified Drag & Drop Zone -->
                  <div class="w-full aspect-video bg-gray-50/50 border-2 border-dashed border-[#e4e6ea] rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary hover:bg-white transition-all cursor-pointer"
                       [class.border-primary]="isDragging()"
                       [class.bg-white]="isDragging()"
                       (dragover)="$event.preventDefault(); isDragging.set(true)"
                       (dragleave)="isDragging.set(false)"
                       (drop)="onFileDropped($event)"
                       (click)="fileInput.click()">
                       
                       @if (currentProd.imageUrl) {
                          <div class="w-full h-full p-8 flex items-center justify-center relative">
                             <img [src]="currentProd.imageUrl" class="max-w-full max-h-full object-contain drop-shadow-xl" alt="Main product view">
                             <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                                <button (click)="$event.stopPropagation(); openCropper(currentProd.imageUrl)" class="w-14 h-14 rounded-full bg-white shadow-2xl text-primary flex items-center justify-center hover:scale-110 active:scale-90 transition-all" title="Recadrer l'image principale">
                                   <mat-icon class="scale-110">crop</mat-icon>
                                </button>
                                <button (click)="$event.stopPropagation(); currentProd.imageUrl = ''" class="w-14 h-14 rounded-full bg-white shadow-2xl text-red-500 flex items-center justify-center hover:scale-110 active:scale-90 transition-all font-bold" title="Supprimer">
                                   <mat-icon class="scale-110">delete</mat-icon>
                                </button>
                             </div>
                          </div>
                       } @else {
                          <div class="flex flex-col items-center gap-5 text-center px-10">
                             <div class="w-20 h-20 rounded-[2.5rem] bg-white border border-[#f0f2f5] shadow-sm flex items-center justify-center text-primary">
                               <mat-icon class="scale-[2]">image</mat-icon>
                             </div>
                             <div>
                                <p class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-[0.2em]">Glissez vos images ici</p>
                                <p class="text-[9px] text-muted mt-2 font-medium">Glissez un ou plusieurs fichiers pour alimenter la galerie</p>
                             </div>
                          </div>
                       }

                       <input type="file" #fileInput (change)="onFileSelected($event)" multiple accept="image/*" class="hidden">

                       <!-- PROGRESS BAR OVERLAY -->
                       @if (uploadProgress() > 0) {
                          <div class="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-12 animate-fade-in">
                             <div class="w-full max-w-xs">
                                <div class="flex justify-between items-end mb-4">
                                   <p class="text-[10px] font-black text-[#0D1B2A] uppercase tracking-[0.25em]">Synchronisation...</p>
                                   <span class="text-[10px] font-black text-primary">{{uploadProgress()}}%</span>
                                </div>
                                <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                  <div class="h-full bg-primary transition-all duration-300" [style.width.%]="uploadProgress()"></div>
                                </div>
                             </div>
                          </div>
                       }
                  </div>

                  <!-- GALLERY STRIP -->
                  @if (galleryList().length > 0) {
                    <div class="space-y-4">
                       <div class="flex items-center justify-between px-2">
                          <p class="text-[10px] font-black text-[#0D1B2A] uppercase tracking-[0.2em]">Vue Galerie ({{galleryList().length}})</p>
                          <p class="text-[9px] text-muted italic font-medium">L'image principale est la première de la liste</p>
                       </div>
                       <div class="flex flex-wrap gap-4">
                          @for (img of galleryList(); track img; let i = $index) {
                             <div class="w-24 h-24 rounded-3xl bg-gray-50 border border-[#f0f2f5] relative group overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <img [src]="img" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                   <div class="flex gap-1.5">
                                      <button (click)="openCropper(img, i)" class="w-8 h-8 rounded-full bg-white text-navy flex items-center justify-center hover:scale-110 active:scale-95 shadow-lg"><mat-icon class="scale-50">crop</mat-icon></button>
                                      <button (click)="removeGalleryImg(i)" class="w-8 h-8 rounded-full bg-white text-red-500 flex items-center justify-center hover:scale-110 active:scale-95 shadow-lg"><mat-icon class="scale-50">delete</mat-icon></button>
                                   </div>
                                </div>
                                <div class="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded-lg text-[8px] font-black border border-[#f0f2f5] shadow-sm uppercase">P-{{i + 1}}</div>
                             </div>
                          }
                       </div>
                    </div>
                  }
               </div>

               <!-- TECHNICAL SPECS -->
               <div class="space-y-8 bg-white p-10 rounded-[3rem] border border-[#f0f2f5] shadow-sm animate-field">
                  <div class="space-y-2.5 animate-field">
                    <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Description Commerciale</label>
                    <textarea [(ngModel)]="currentProd.description" rows="6" placeholder="Décrivez les fonctionnalités clés, garanties et avantages..." class="w-full bg-gray-50/50 border border-[#e4e6ea] rounded-[2.5rem] p-8 text-xs font-medium focus:bg-white focus:border-primary outline-none transition-all resize-none leading-relaxed"></textarea>
                  </div>
               </div>
            </div>

            <!-- FOOTER MODAL -->
            <div class="p-10 border-t border-[#f0f2f5] bg-white shrink-0 mt-auto">
               <button (click)="saveProduct()" [disabled]="!isValid() || loading()" 
                       class="w-full h-16 bg-[#0D1B2A] text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-navy/20 hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-6 group">
                  @if (loading()) {
                    <mat-icon class="animate-spin scale-90">sync</mat-icon> SYNC EN COURS...
                  } @else {
                    <mat-icon class="scale-90 group-hover:translate-x-1 transition-transform">verified</mat-icon> {{ editing() ? 'SAUVEGARDER LES MODIFICATIONS' : 'INSCRIRE AU CATALOGUE LIVE' }}
                  }
               </button>
            </div>
          </div>
        </div>
      }

      <!-- CROPPER OVERLAY COMMAND CENTER -->
      @if (croppingImage()) {
         <div class="fixed inset-0 z-[10000] flex items-center justify-center p-6 md:p-12">
            <div class="absolute inset-0 bg-dark/95 backdrop-blur-3xl animate-fade-in" (click)="closeCropper()"></div>
            <div class="relative bg-white w-full max-w-3xl rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] animate-slide-left boarder border-white/20">
               <div class="p-10 border-b border-[#f0f2f5] flex items-center justify-between shrink-0">
                  <div>
                    <h3 class="text-2xl font-black text-[#0D1B2A] uppercase tracking-tighter">Studio Media O'CHAP.</h3>
                    <p class="text-[10px] font-black text-primary uppercase mt-1.5 tracking-[0.2em]">Optimisation visuelle intelligente</p>
                  </div>
                  <div class="flex items-center gap-3">
                     <button (click)="rotateLeft()" class="w-12 h-12 rounded-2xl bg-gray-50 text-[#0D1B2A] hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90" title="Pivoter à gauche"><mat-icon>rotate_left</mat-icon></button>
                     <button (click)="rotateRight()" class="w-12 h-12 rounded-2xl bg-gray-50 text-[#0D1B2A] hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90" title="Pivoter à droite"><mat-icon>rotate_right</mat-icon></button>
                  </div>
               </div>

               <div class="flex-1 overflow-hidden relative bg-[#fafbfc] flex items-center justify-center p-8">
                  <image-cropper
                     [imageBase64]="croppingBase64"
                     [maintainAspectRatio]="true"
                     [aspectRatio]="1 / 1"
                     [transform]="cropTransform"
                     format="webp"
                     [imageQuality]="90"
                     (imageCropped)="imageCropped($event)"
                     class="max-w-full max-h-full rounded-2xl shadow-inner"
                  ></image-cropper>
               </div>

               <div class="p-10 bg-white border-t border-[#f0f2f5] flex items-center justify-between shrink-0">
                  <button (click)="closeCropper()" class="h-14 px-8 rounded-2xl border-2 border-[#e4e6ea] text-muted text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95">Annuler</button>
                  <button (click)="applyCrop()" class="h-14 px-12 bg-[#0D1B2A] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-navy/20 active:scale-95 hover:bg-primary transition-all">Valider l'optimisation</button>
               </div>
            </div>
         </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    .animate-slide-left { animation: slideLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideLeft { 
      from { transform: translateX(100%); opacity: 0; } 
      to { transform: translateX(0); opacity: 1; } 
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .font-price { font-family: 'Outfit', sans-serif; }
  `]
})
export class InventoryComponent implements OnInit, OnDestroy {
  products = signal<OchapProduct[]>([]);
  filterCat = signal('all');
  searchQuery = '';
  showLowStockOnly = signal(false);
  private unsub?: Unsubscribe;

  // UI States
  showAddPanel = signal(false);
  editing = signal(false);
  loading = signal(false);
  isDragging = signal(false);
  
  // Image Toolbox
  croppingImage = signal(false);
  croppingBase64 = '';
  croppedResult = '';
  croppingIdx: number | null = null;
  cropTransform = { rotate: 0 };
  uploadProgress = signal(0);
  galleryList = signal<string[]>([]);
  
  Math = Math;

  // Form Model
  currentProd: OchapProduct = { id: '', name: '', category: 'frigo', price: 0, imageUrl: '', description: '', stock: 0, threshold: 10, brand: '', supplierRef: '' };

  filteredProducts = computed(() => {
    let list = this.products();
    if (this.filterCat() !== 'all') list = list.filter(p => p.category === this.filterCat());
    if (this.showLowStockOnly()) {
      list = list.filter(p => (p.stock || 0) <= (p.threshold || 10));
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand?.toLowerCase().includes(q) || 
        p.supplierRef?.toLowerCase().includes(q)
      );
    }
    // Sort by recent first
    return list.sort((a, b) => {
      const t1 = (a.createdAt as { seconds?: number })?.seconds || 0;
      const t2 = (b.createdAt as { seconds?: number })?.seconds || 0;
      return t2 - t1;
    });
  });

  countOutOfStock = computed(() => this.products().filter(p => p.stock === 0).length);
  countLowStock = computed(() => this.products().filter(p => p.stock > 0 && p.stock <= (p.threshold || 10)).length);
  calculateValue = computed(() => {
    const total = this.products().reduce((sum, p) => sum + (p.price * p.stock), 0);
    return (total / 1000000).toFixed(1);
  });

  ngOnInit() {
    this.initWatch();
  }

  initWatch() {
    const currentUser = auth.currentUser;
    const path = 'products';
    let q;
    
    if (currentUser) {
      q = query(collection(db, path), where('supplierId', '==', currentUser.uid));
    } else {
      q = query(collection(db, path));
    }

    if (this.unsub) this.unsub();
    this.unsub = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      this.products.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapProduct)));
    });
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  // --- IMAGE LOGIC ---
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) this.processFiles(Array.from(files));
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.processFiles(Array.from(files));
  }

  private async processFiles(files: File[]) {
    this.uploadProgress.set(5);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const result = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      if (i === 0 && !this.currentProd.imageUrl) {
        this.currentProd.imageUrl = result;
      }
      this.galleryList.update(list => [...list, result]);
      
      const p = Math.floor(((i + 1) / files.length) * 100);
      this.uploadProgress.set(p);
      await new Promise(r => setTimeout(r, 100));
    }
    setTimeout(() => this.uploadProgress.set(0), 600);
  }

  removeGalleryImg(idx: number) {
    const imgToRemove = this.galleryList()[idx];
    if (this.currentProd.imageUrl === imgToRemove) {
      this.currentProd.imageUrl = '';
    }
    this.galleryList.update(list => list.filter((_, i) => i !== idx));
    // If we removed the head image, try to promote the next one
    if (!this.currentProd.imageUrl && this.galleryList().length > 0) {
      this.currentProd.imageUrl = this.galleryList()[0];
    }
  }

  openCropper(baseUrl: string, idx: number | null = null) {
    this.croppingBase64 = baseUrl;
    this.croppingIdx = idx;
    this.cropTransform = { rotate: 0 };
    this.croppingImage.set(true);
  }

  closeCropper() {
    this.croppingImage.set(false);
    this.croppingIdx = null;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedResult = event.base64 || '';
  }

  rotateLeft() { this.cropTransform = { rotate: this.cropTransform.rotate - 90 }; }
  rotateRight() { this.cropTransform = { rotate: this.cropTransform.rotate + 90 }; }

  applyCrop() {
    if (!this.croppedResult) return;
    
    if (this.croppingIdx !== null) {
      this.galleryList.update(list => {
        const newList = [...list];
        newList[this.croppingIdx!] = this.croppedResult;
        return newList;
      });
      // Also update main image if it was the same
      if (this.currentProd.imageUrl === this.croppingBase64) {
        this.currentProd.imageUrl = this.croppedResult;
      }
    } else {
      this.currentProd.imageUrl = this.croppedResult;
    }
    this.closeCropper();
  }

  isSkuValid(): boolean {
    if (!this.currentProd.supplierRef) return true;
    const regex = /^OCH-[A-Z0-9]{4}-[A-Z0-9]$/i;
    return regex.test(this.currentProd.supplierRef.trim());
  }

  animateFormFields() {
    setTimeout(() => {
      const fields = document.querySelectorAll('.animate-field');
      if (fields.length > 0) {
        animate(
          fields,
          { opacity: [0, 1], y: [15, 0] },
          {
            delay: stagger(0.04),
            duration: 0.4,
            ease: 'easeOut'
          }
        );
      }
    }, 600); // Trigger after the panel slide-left transitions starts
  }

  // --- FORM ACTIONS ---
  openAddPanel() {
    this.editing.set(false);
    this.currentProd = { id: '', name: '', category: 'frigo', price: 0, imageUrl: '', description: '', stock: 0, threshold: 5, brand: '', supplierRef: '' };
    this.galleryList.set([]);
    this.showAddPanel.set(true);
    this.animateFormFields();
  }

  editProduct(prod: OchapProduct) {
    this.editing.set(true);
    this.currentProd = { ...prod };
    this.galleryList.set(prod.galleryUrls || (prod.imageUrl ? [prod.imageUrl] : []));
    this.showAddPanel.set(true);
    this.animateFormFields();
  }

  async saveProduct() {
    if (!this.isValid()) return;
    
    // Automatically generate sequential SKU if left empty
    if (!this.currentProd.supplierRef || !this.currentProd.supplierRef.trim()) {
      const catCharMap: Record<string, string> = {
        frigo: 'F', congel: 'C', tv: 'T', clim: 'A', laver: 'L', cuisine: 'K', micro: 'M', cafe: 'O', phone: 'P'
      };
      const suffix = catCharMap[this.currentProd.category] || this.currentProd.category.toUpperCase()[0] || 'X';
      // Use short time token (microseconds modulo 10000) for a clean OCH-XXXX-X matching 4 digits and 1 char suffix
      const middle = (Date.now() % 10000).toString().padStart(4, '0');
      this.currentProd.supplierRef = `OCH-${middle}-${suffix}`;
    } else {
      this.currentProd.supplierRef = this.currentProd.supplierRef.trim().toUpperCase();
    }

    this.loading.set(true);
    
    try {
      const prodData = {
        name: this.currentProd.name,
        category: this.currentProd.category,
        price: Number(this.currentProd.price),
        imageUrl: this.currentProd.imageUrl,
        galleryUrls: this.galleryList(),
        description: this.currentProd.description || '',
        brand: this.currentProd.brand || '',
        supplierRef: this.currentProd.supplierRef || '',
        stock: Number(this.currentProd.stock),
        threshold: Number(this.currentProd.threshold),
        updatedAt: serverTimestamp(),
        supplierId: auth.currentUser?.uid || 'admin'
      };

      if (this.editing()) {
        await updateDoc(doc(db, 'products', this.currentProd.id), prodData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...prodData,
          createdAt: serverTimestamp()
        });
      }
      this.showAddPanel.set(false);
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue lors de la synchronisation avec le catalogue.');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProduct(event: Event, id: string) {
    event.stopPropagation();
    if (!confirm('Voulez-vous supprimer définitivement cet article du catalogue O\'CHAP ?')) return;
    try { await deleteDoc(doc(db, 'products', id)); } catch (e) { console.error(e); }
  }

  async updateQuickStock(productId: string, newStock: number, newThreshold: number) {
    if (newStock < 0) return;
    try {
      const pRef = doc(db, 'products', productId);
      await updateDoc(pRef, {
        stock: newStock,
        threshold: newThreshold,
        updatedAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  }

  isValid() { 
    return this.currentProd.name && 
           this.currentProd.name.length > 3 && 
           this.currentProd.price > 0 && 
           this.currentProd.imageUrl &&
           (!this.currentProd.supplierRef || this.isSkuValid());
  }
}
