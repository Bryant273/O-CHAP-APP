import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Gestion du Catalogue</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Administration des articles et catégories au niveau global</p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/" class="h-11 px-6 rounded-xl border border-[#e4e6ea] text-[#0D1B2A] text-xs font-bold hover:bg-[#f0f2f5] transition-all flex items-center gap-2">
            <mat-icon class="scale-75">visibility</mat-icon> Marketplace
          </a>
          <button class="bg-primary text-white h-11 px-6 rounded-xl text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
            <mat-icon class="scale-75">add_box</mat-icon> Nouveau Produit
          </button>
        </div>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[#fafbfc] border-b border-[#e4e6ea]">
              <tr>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Produit</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Prix (Gros/Détail)</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Stock</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Catégorie</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Vendeur</th>
                <th class="px-8 py-5 text-right text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#f5f6f8]">
               @if (dataService.products$().length === 0) {
                 <tr><td colspan="6" class="px-8 py-16 text-center text-[11px] font-black text-[#9699a8] italic uppercase tracking-widest">Master Database vide ou en cours de sync...</td></tr>
               }
               @for (product of dataService.products$(); track product.id) {
                 <tr class="hover:bg-[#fafbfc] transition-all group">
                   <td class="px-8 py-5">
                      <div class="flex items-center gap-4">
                         @if (product.imageUrl) {
                            <img [src]="product.imageUrl" alt="Aperçu du produit O'CHAP" class="w-10 h-10 rounded-lg object-cover bg-[#f8f9fa] border border-[#e4e6ea]">
                         } @else {
                            <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-400 flex items-center justify-center"><mat-icon class="scale-75">image</mat-icon></div>
                         }
                         <div>
                            <div class="text-xs font-black text-[#0D1B2A]">{{product.name}}</div>
                            <div class="text-[9px] text-[#9699a8] font-bold italic">{{product.unit}}</div>
                         </div>
                      </div>
                   </td>
                   <td class="px-8 py-5">
                      <div class="flex flex-col">
                        <span class="text-xs font-black text-[#0D1B2A] font-price">{{formatAmount(product.wholesalePrice)}} F</span>
                        <span class="text-[9px] text-[#9699a8] font-bold font-price">{{formatAmount(product.retailPrice)}} F</span>
                      </div>
                   </td>
                    <td class="px-8 py-5">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-black" 
                              [class.text-red-500]="product.stock < 10" 
                              [class.text-indigo-600]="product.stock >= 10">{{product.stock}}</span>
                        <span class="text-[9px] font-bold text-[#9699a8] uppercase">{{product.stockUnit || 'U'}}</span>
                      </div>
                    </td>
                   <td class="px-8 py-5">
                      <span class="px-2 py-0.5 rounded-md bg-[#f0f2f5] text-[#5a5e72] text-[8px] font-black uppercase tracking-widest">{{product.category || 'Général'}}</span>
                   </td>
                   <td class="px-8 py-5 text-[10px] text-[#9699a8] font-bold italic">{{product.supplierName || 'ID:' + product.supplierId?.slice(-4)}}</td>
                   <td class="px-8 py-5">
                      <div class="flex items-center justify-end gap-2">
                        <a [routerLink]="['/products', product.id]" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#9699a8] hover:bg-[#0D1B2A] hover:text-white transition-all shadow-sm">
                           <mat-icon class="scale-75">visibility</mat-icon>
                        </a>
                        <button class="w-8 h-8 rounded-lg flex items-center justify-center text-[#9699a8] hover:bg-white hover:text-primary transition-all">
                          <mat-icon class="scale-75">edit</mat-icon>
                        </button>
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
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminProducts {
  public dataService = inject(DataService);

  formatAmount(val: number | unknown): string {
    return new Intl.NumberFormat('fr-FR').format(Number(val) || 0);
  }
}
