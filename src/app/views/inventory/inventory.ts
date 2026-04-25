import { ChangeDetectionStrategy, Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { auth, db } from '../../services/firebase';
import { onSnapshot, collection, query, where, Unsubscribe, QuerySnapshot, DocumentData, updateDoc, doc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { OchapProduct } from '../../services/data.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- HEADER EXECUTIVE -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Gestion des Stocks.</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Hub Logistique Central O'CHAP — Administration</p>
        </div>
        
        <div class="flex items-center gap-4">
           <div class="px-5 py-2.5 bg-emerald-50 border border-emerald-100/50 text-emerald-700 rounded-2xl text-[10px] font-black flex items-center gap-3 shadow-sm">
             <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             INVENTAIRE LIVE
           </div>
           <button (click)="openAddPanel()" class="bg-[#0D1B2A] text-white px-6 h-12 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-navy/10 flex items-center gap-3 active:scale-95" title="Créer un nouveau produit">
             <mat-icon class="scale-75">add_box</mat-icon>
             Nouveau Produit
           </button>
        </div>
      </div>

      <!-- KPIS RAPIDES -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
         <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm">
            <div class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest mb-1">Total Articles</div>
            <div class="text-2xl font-black text-[#0D1B2A]">{{products().length}}</div>
         </div>
         <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm">
            <div class="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">En Rupture</div>
            <div class="text-2xl font-black text-red-600">{{countOutOfStock()}}</div>
         </div>
         <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm">
            <div class="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Alertes Seuil</div>
            <div class="text-2xl font-black text-orange-600">{{countLowStock()}}</div>
         </div>
         <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm">
            <div class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Valorisation</div>
            <div class="text-2xl font-black text-emerald-600">{{calculateValue()}}M</div>
         </div>
      </div>

      <!-- FILTRES & CATÉGORIES -->
      <div class="flex flex-wrap items-center gap-3 py-2">
         <button (click)="filterCat.set('all')" [class.bg-primary]="filterCat() === 'all'" [class.text-white]="filterCat() === 'all'" class="px-5 h-9 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#e4e6ea] hover:border-primary transition-all" title="Filtrer par tout">Tous</button>
         @for (cat of ['frigo', 'tv', 'clim', 'laver', 'cuisine']; track cat) {
            <button (click)="filterCat.set(cat)" [class.bg-primary]="filterCat() === cat" [class.text-white]="filterCat() === cat" class="px-5 h-9 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#e4e6ea] hover:border-primary transition-all" [title]="'Filtrer par ' + cat">
              {{cat}}
            </button>
         }
         <div class="flex-1"></div>
         <div class="relative w-full md:w-64">
           <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-[#9699a8] scale-75">search</mat-icon>
           <input type="text" [(ngModel)]="searchQuery" placeholder="Filtrer l'inventaire..." class="w-full h-10 bg-white border border-[#e4e6ea] rounded-full pl-11 pr-4 text-xs font-bold outline-none focus:border-primary transition-all">
         </div>
      </div>

      <!-- LISTING HAUTE DENSITÉ -->
      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-oc-sm overflow-hidden min-h-[400px]">
         <div class="overflow-x-auto">
            <table class="w-full border-collapse">
               <thead>
                  <tr class="bg-[#fafbfc] border-b border-[#e4e6ea]">
                     <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.15em]">Produit</th>
                     <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.15em]">Catégorie</th>
                     <th class="px-8 py-5 text-center text-[10px] font-black text-[#9699a8] uppercase tracking-[0.15em]">Stock</th>
                     <th class="px-8 py-5 text-center text-[10px] font-black text-[#9699a8] uppercase tracking-[0.15em]">Seuil</th>
                     <th class="px-8 py-5 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-[0.15em]">Prix Unitaire</th>
                     <th class="px-8 py-5 text-center text-[10px] font-black text-[#9699a8] uppercase tracking-[0.15em]">Actions</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-[#f5f6f8]">
                  @for (product of filteredProducts(); track product.id) {
                     <tr class="hover:bg-[#fafbfc] group transition-all">
                        <td class="px-8 py-4">
                           <div class="flex items-center gap-4">
                              <div class="w-12 h-12 rounded-2xl bg-[#f0f2f5] p-1 overflow-hidden border border-[#e4e6ea] group-hover:scale-105 transition-all">
                                 <img [src]="product.imageUrl" class="w-full h-full object-cover rounded-xl" referrerpolicy="no-referrer" [alt]="product.name">
                              </div>
                              <div>
                                 <div class="text-xs font-black text-[#0D1B2A]">{{product.name}}</div>
                                 <div class="text-[9px] font-bold text-[#9699a8] uppercase tracking-widest mt-0.5">{{product.brand}}</div>
                              </div>
                           </div>
                        </td>
                        <td class="px-8 py-4">
                           <span class="px-3 py-1 rounded-full bg-[#f0f2f5] text-[9px] font-black text-[#5a5e72] uppercase tracking-widest border border-[#e4e6ea]">
                              {{product.category}}
                           </span>
                        </td>
                        <td class="px-8 py-4 text-center">
                           <div class="flex flex-col items-center gap-1.5">
                              <span class="text-xs font-black" [class.text-red-600]="(product.stock || 0) <= (product.threshold || 0)">
                                 {{product.stock || 0}}
                              </span>
                              <div class="w-12 h-1 bg-[#f0f2f5] rounded-full overflow-hidden">
                                 <div class="h-full transition-all duration-700" 
                                      [class.bg-red-500]="(product.stock || 0) <= (product.threshold || 0)"
                                      [class.bg-emerald-500]="(product.stock || 0) > (product.threshold || 0)"
                                      [style.width.%]="((product.stock || 0) / 50) * 100"></div>
                              </div>
                           </div>
                        </td>
                        <td class="px-8 py-4 text-center text-xs font-bold text-[#5a5e72]">{{product.threshold}}</td>
                        <td class="px-8 py-4 text-right text-xs font-black text-[#0D1B2A]">{{product.price}} FCFA</td>
                        <td class="px-8 py-4">
                           <div class="flex justify-center gap-2">
                              <button (click)="editProduct(product)" class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all" title="Modifier le produit">
                                 <mat-icon class="scale-75">edit</mat-icon>
                              </button>
                              <button (click)="deleteProduct($event, product.id)" class="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all" title="Supprimer le produit">
                                 <mat-icon class="scale-75">delete</mat-icon>
                              </button>
                           </div>
                        </td>
                     </tr>
                  }
               </tbody>
            </table>
         </div>
         @if (filteredProducts().length === 0) {
            <div class="py-20 text-center flex flex-col items-center gap-4">
               <div class="w-16 h-16 rounded-[2rem] bg-[#f0f2f5] flex items-center justify-center text-[#9699a8]"><mat-icon class="scale-125">inventory_2</mat-icon></div>
               <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Aucun résultat pour cette recherche.</p>
            </div>
         }
      </div>

      <!-- Add/Edit Product Panel -->
      @if (showAddPanel()) {
        <div class="fixed inset-0 z-[1000] flex justify-end">
          <div class="absolute inset-0 bg-[#0D1B2A]/40 backdrop-blur-sm animate-fade-in" (click)="showAddPanel.set(false)" tabindex="-1" role="presentation"></div>
          <div class="relative w-full max-w-xl bg-white h-full shadow-2xl animate-slide-left p-8 flex flex-col">
            <div class="flex items-center justify-between mb-8 pb-6 border-b border-[#e4e6ea]">
               <div>
                  <h3 class="text-xl font-black text-[#0D1B2A] tracking-tighter">{{ editing() ? 'Modifier' : 'Nouveau' }} Article.</h3>
                  <p class="text-[9px] font-black text-[#9699a8] uppercase tracking-widest mt-1">Édition des métadonnées catalogue</p>
               </div>
               <button (click)="showAddPanel.set(false)" class="w-10 h-10 rounded-full hover:bg-[#f0f2f5] transition-all flex items-center justify-center text-[#5a5e72]" title="Fermer le panneau"><mat-icon>close</mat-icon></button>
            </div>

            <div class="flex-1 overflow-y-auto no-scrollbar space-y-8">
               <div class="space-y-6">
                   <div class="space-y-1.5">
                    <label for="pName" class="text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest ml-1">Désignation</label>
                    <input id="pName" type="text" [(ngModel)]="currentProd.name" placeholder="Ex: Réfrigérateur LG ThinQ" class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-5 text-sm font-bold focus:border-primary outline-none transition-all">
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                     <div class="space-y-1.5">
                       <label for="pBrand" class="text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest ml-1">Marque</label>
                       <input id="pBrand" type="text" [(ngModel)]="currentProd.brand" placeholder="Samsung..." class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-5 text-sm font-bold focus:border-primary outline-none transition-all">
                     </div>
                     <div class="space-y-1.5">
                       <label for="pPrice" class="text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest ml-1">Prix (CFA)</label>
                       <input id="pPrice" type="number" [(ngModel)]="currentProd.price" class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-5 text-sm font-black focus:border-primary outline-none transition-all text-primary">
                     </div>
                  </div>

                  <div class="space-y-1.5">
                    <label for="pCat" class="text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest ml-1">Catégorie Métier</label>
                    <select id="pCat" [(ngModel)]="currentProd.category" class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-5 text-sm font-bold focus:border-primary outline-none transition-all appearance-none cursor-pointer">
                      <option value="frigo">Réfrigérateurs</option>
                      <option value="tv">Téléviseurs</option>
                      <option value="clim">Climatiseurs</option>
                      <option value="laver">Lave-linge</option>
                      <option value="cuisine">Cuisinières</option>
                    </select>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                     <div class="space-y-1.5">
                       <label for="pStock" class="text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest ml-1">Stock Initial</label>
                       <input id="pStock" type="number" [(ngModel)]="currentProd.stock" class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-5 text-sm font-black outline-none transition-all">
                     </div>
                     <div class="space-y-1.5">
                       <label for="pThreshold" class="text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest ml-1">Seuil Alerte</label>
                       <input id="pThreshold" type="number" [(ngModel)]="currentProd.threshold" class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-5 text-sm font-black outline-none transition-all">
                     </div>
                  </div>

                  <div class="space-y-1.5">
                    <label for="pMedia" class="text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest ml-1">URL Média</label>
                    <input id="pMedia" type="text" [(ngModel)]="currentProd.imageUrl" placeholder="https://..." class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-5 text-[11px] font-medium outline-none transition-all text-[#5a5e72]">
                  </div>

                  <div class="space-y-1.5">
                    <label for="pDesc" class="text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest ml-1">Description Technique</label>
                    <textarea id="pDesc" [(ngModel)]="currentProd.description" rows="5" class="w-full bg-[#fcfcfd] border border-[#e4e6ea] rounded-[2rem] p-5 text-xs font-medium focus:border-primary outline-none transition-all resize-none"></textarea>
                  </div>
              </div>
            </div>

            <div class="pt-8 border-t border-[#e4e6ea] mt-auto">
               <button (click)="saveProduct()" [disabled]="!isValid()" 
                       class="w-full h-14 bg-[#0D1B2A] text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-navy/20 hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4">
                  @if (loading()) {
                    <mat-icon class="animate-spin scale-75">sync</mat-icon> SYNC EN COURS...
                  } @else {
                    <mat-icon class="scale-75">verified</mat-icon> CONFIRMER LES CHANGEMENTS
                  }
               </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-left { animation: slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `]
})
export class InventoryComponent implements OnInit, OnDestroy {
  products = signal<OchapProduct[]>([]);
  filterCat = signal('all');
  searchQuery = '';
  private unsub?: Unsubscribe;

  // UI State Signals
  showAddPanel = signal(false);
  editing = signal(false);
  loading = signal(false);

  // Form State
  currentProd: OchapProduct = { id: '', name: '', category: 'frigo', price: 0, imageUrl: '', description: '', stock: 0, threshold: 10, brand: '', technicalSpecs: '{}' };

  filteredProducts = computed(() => {
    let list = this.products();
    if (this.filterCat() !== 'all') list = list.filter(p => p.category === this.filterCat());
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    return list;
  });

  countOutOfStock = computed(() => this.products().filter(p => p.stock === 0).length);
  countLowStock = computed(() => this.products().filter(p => p.stock > 0 && p.stock <= (p.threshold || 10)).length);
  calculateValue = computed(() => {
    const total = this.products().reduce((sum, p) => sum + (p.price * p.stock), 0);
    return (total / 1000000).toFixed(1);
  });

  asNumber(val: unknown): number { return val as number; }
  asString(val: unknown): string { return val as string; }

  ngOnInit() {
    const currentUser = auth.currentUser;
    const path = 'products';
    let q;
    
    // For demo/admin purposes, if no currentUser (not logged as supplier), show all products
    if (currentUser) {
      q = query(collection(db, path), where('supplierId', '==', currentUser.uid));
    } else {
      q = query(collection(db, path));
    }

    this.unsub = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      this.products.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OchapProduct)));
    });
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  openAddPanel() {
    this.editing.set(false);
    this.currentProd = {
      id: '',
      name: '',
      category: 'frigo',
      price: 0,
      imageUrl: '',
      description: '',
      stock: 0,
      threshold: 10,
      brand: '',
      technicalSpecs: '{"Marque": "...", "Modèle": "...", "Voltage": "220V"}'
    };
    this.showAddPanel.set(true);
  }

  editProduct(prod: OchapProduct) {
    this.editing.set(true);
    this.currentProd = { ...prod };
    this.showAddPanel.set(true);
  }

  async saveProduct() {
    if (!this.isValid()) return;
    this.loading.set(true);
    
    try {
      const prodData = {
        name: this.currentProd.name,
        category: this.currentProd.category,
        price: Number(this.currentProd.price),
        imageUrl: this.currentProd.imageUrl,
        description: this.currentProd.description,
        brand: this.currentProd.brand || '',
        technicalSpecs: this.currentProd.technicalSpecs || '{}',
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
          createdAt: serverTimestamp(),
          views: 0,
          sales: 0,
          rating: 0,
          reviewCount: 0
        });
      }
      this.showAddPanel.set(false);
    } catch (error: unknown) {
      console.error('Erreur sauvegarde produit:', error);
      alert('Erreur lors de la sauvegarde du produit. Vérifiez vos permissions.');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProduct(event: Event, id: string) {
    event.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error: unknown) {
      console.error('Erreur suppression produit:', error);
    }
  }

  async updateQuickStock(productId: string, stockVal: string, thresholdVal: string) {
    const newStock = parseInt(stockVal, 10);
    const newThreshold = parseInt(thresholdVal, 10);
    
    if (isNaN(newStock) || newStock < 0) return;
    if (isNaN(newThreshold) || newThreshold < 0) return;
    
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock: newStock,
        threshold: newThreshold,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  }

  isValid() {
    return this.currentProd.name && this.currentProd.price > 0 && this.currentProd.imageUrl;
  }
}
