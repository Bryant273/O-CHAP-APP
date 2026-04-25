import { ChangeDetectionStrategy, Component, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DataService, OchapProduct } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-supplier-inventory',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in relative z-10">
      
      <!-- Inventory Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-[#0D1B2A] tracking-tight uppercase italic underline decoration-primary decoration-4 underline-offset-8">Gestion du stock</h2>
          <p class="text-xs text-[#5a5e72] mt-4 font-medium">Suivi en temps réel de vos disponibilités et réapprovisionnement</p>
        </div>
        <div class="flex items-center gap-3">
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
            <p class="text-xl font-black text-[#0D1B2A] italic">{{ products().length }}</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#fdedec] text-[#e17055] flex items-center justify-center">
            <mat-icon>warning</mat-icon>
          </div>
          <div>
            <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest">Articles Critiques</p>
            <p class="text-xl font-black text-[#0D1B2A] italic">{{ lowStockCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-[2rem] border border-[#e4e6ea] shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-[#e8fdf5] text-[#00b894] flex items-center justify-center">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div>
            <p class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest">Valeur Stock</p>
            <p class="text-xl font-black text-[#0D1B2A] italic">{{ totalValue() }}</p>
          </div>
        </div>
      </div>

      <!-- Inventory Table Card -->
      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
        <div class="overflow-x-auto no-scrollbar">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-[#fcfcfd]">
                <th class="px-8 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Produit</th>
                <th class="px-8 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest hidden md:table-cell">Catégorie</th>
                <th class="px-8 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Stock Actuel</th>
                <th class="px-8 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Seuil Alerte</th>
                <th class="px-8 py-6 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">État</th>
                <th class="px-8 py-6 text-right text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f0f2f5]">
              @for (p of products(); track p.id) {
                <tr class="hover:bg-[#fafafa] transition-colors group">
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-[#f0f2f5] overflow-hidden border border-[#e4e6ea] shrink-0 relative group/img">
                        <img [src]="p.imageUrl || 'https://picsum.photos/seed/'+p.id+'/100/100'" [alt]="p.name" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all cursor-pointer" (click)="triggerImageImport(p)">
                          <mat-icon class="text-white scale-75">add_a_photo</mat-icon>
                        </div>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs font-black text-[#0D1B2A] line-clamp-1 italic">{{ p.name }}</span>
                        <span class="text-[9px] text-[#9699a8] font-mono tracking-tighter">{{ p.id }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-6 hidden md:table-cell">
                    <span class="text-[10px] font-black text-[#5a5e72] uppercase tracking-wider bg-[#f0f2f5] px-2.5 py-1 rounded-lg">{{ p.category }}</span>
                  </td>
                  <td class="px-8 py-6">
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
                  <td class="px-8 py-6">
                    <span class="text-xs font-black text-[#0D1B2A] font-mono italic">{{ p.threshold || 5 }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span [class]="getStockStatusClass(p.stock, p.threshold)" class="text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {{ getStockStatusLabel(p.stock, p.threshold) }}
                    </span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <div class="flex justify-end gap-2">
                       <button (click)="triggerImageImport(p)" class="w-9 h-9 rounded-xl bg-[#e8f4fd] text-[#0984e3] hover:scale-105 transition-all flex items-center justify-center" title="Importer Image">
                         <mat-icon class="scale-75">image</mat-icon>
                       </button>
                       <button class="w-9 h-9 rounded-xl bg-[#fef9e6] text-[#f39c12] hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center" [title]="'Modifier ' + p.name">
                         <mat-icon class="scale-75">edit</mat-icon>
                       </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                   <td colspan="6" class="py-24 text-center opacity-30">
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
    return Number(total).toLocaleString('fr-FR') + ' FCFA';
  });

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
    return Number(val || 0).toLocaleString('fr-FR') + ' FCFA';
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
    const url = window.prompt('Entrez l\'URL de la nouvelle image pour ' + product.name, product.imageUrl || '');
    if (url !== null && url.trim() !== '') {
      await this.dataService.updateProduct(product.id, { imageUrl: url });
    }
  }

  getStockStatusLabel(stock: number | string, threshold: number = 5): string {
    const val = Number(stock || 0);
    if (val === 0) return 'Rupture';
    if (val <= threshold) return 'Critique';
    return 'En Stock';
  }

  getStockStatusClass(stock: number | string, threshold: number = 5): string {
    const val = Number(stock || 0);
    if (val === 0) return 'bg-[#fdedec] text-[#e17055]';
    if (val <= threshold) return 'bg-[#fff3ec] text-[#FF6200]';
    return 'bg-[#e8fdf5] text-[#00b894]';
  }

  exportInventory() {
    console.log('Exporting inventory data...');
  }
}
