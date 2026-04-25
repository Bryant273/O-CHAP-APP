import { ChangeDetectionStrategy, Component, inject, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DataService, OchapProduct } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-supplier-products',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in relative z-10">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-[#0D1B2A] tracking-tight uppercase">Catalogue produits</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium">Gérez votre offre au sein du réseau O'CHAP</p>
        </div>
        <button (click)="openAddModal()" class="bg-[#FF6200] text-white px-6 py-3 rounded-full text-xs font-bold shadow-lg shadow-[#FF6200]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
          <mat-icon class="scale-75">add</mat-icon>
          Nouveau Produit
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        @for (p of products(); track p.id) {
          <div class="bg-white rounded-[2rem] border border-[#e4e6ea] overflow-hidden group hover:shadow-xl transition-all">
            <div class="relative aspect-[4/3] bg-[#f0f2f5] overflow-hidden">
              <img [src]="p.imageUrl || 'https://picsum.photos/seed/'+p.id+'/400/300'" [alt]="p.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerpolicy="no-referrer">
              <div class="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button (click)="openEditModal(p)" class="w-9 h-9 rounded-xl bg-white shadow-xl flex items-center justify-center text-[#5a5e72] hover:text-[#FF6200] transition-all" [title]="'Modifier ' + p.name">
                  <mat-icon class="scale-75">edit</mat-icon>
                </button>
                <button (click)="deleteProduct(p.id)" class="w-9 h-9 rounded-xl bg-white shadow-xl flex items-center justify-center text-[#e17055] hover:bg-[#fdedec] transition-all" title="Supprimer">
                  <mat-icon class="scale-75">delete</mat-icon>
                </button>
              </div>
            </div>
            <div class="p-6">
              <span class="text-[10px] font-black text-[#9699a8] uppercase tracking-widest mb-1 block">{{ p.category }}</span>
              <h3 class="text-xs font-black text-[#0D1B2A] line-clamp-1 mb-3">{{ p.name }}</h3>
              <div class="flex items-center justify-between">
                <span class="text-sm font-black text-[#FF6200] font-mono">{{ formatPrice(p.price) }}</span>
                <span [class]="p.stock > 0 ? 'text-[#00b894] bg-[#e8fdf5]' : 'text-[#e17055] bg-[#fdedec]'" class="text-[9px] font-black px-2 py-1 rounded-md uppercase">
                   {{ p.stock > 0 ? p.stock + ' en stock' : 'Rupture' }}
                </span>
              </div>
            </div>
          </div>
        } @empty {
           <div class="col-span-full py-24 flex flex-col items-center justify-center text-center opacity-30">
              <mat-icon class="scale-[3] mb-6 text-[#1a1a2e]">inventory_2</mat-icon>
              <h3 class="text-sm font-black uppercase tracking-widest">Aucun produit au catalogue</h3>
              <p class="text-[10px] font-medium mt-2">Cliquez sur "Nouveau Produit" pour référencer votre marchandise.</p>
           </div>
        }
      </div>

      <!-- PRODUCT MODAL -->
      @if (showModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closeModal()"></div>
          <div class="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-fade-in overflow-hidden">
            <div class="px-8 py-6 border-b border-[#e4e6ea] flex items-center justify-between bg-[#fcfcfd]">
              <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest italic">
                {{ editingProduct() ? 'Modifier le produit' : 'Créer un produit' }}
              </h3>
              <button (click)="closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f0f2f5] transition-all">
                <mat-icon class="scale-75 text-[#9699a8]">close</mat-icon>
              </button>
            </div>

            <form (ngSubmit)="saveProduct()" class="p-8 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Nom du produit</label>
                  <input type="text" [(ngModel)]="form.name" name="name" required
                         class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-medium focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
                </div>
                
                <div>
                  <label class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Catégorie</label>
                  <select [(ngModel)]="form.category" name="category" required
                          class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-medium focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
                    <option value="Électronique">Électronique</option>
                    <option value="Mode">Mode</option>
                    <option value="Maison">Maison</option>
                    <option value="Beauté">Beauté</option>
                    <option value="Alimentation">Alimentation</option>
                    <option value="Sport">Sport</option>
                  </select>
                </div>
                
                <div>
                  <label class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Prix (FCFA)</label>
                  <input type="number" [(ngModel)]="form.price" name="price" required
                         class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-black font-mono focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
                </div>

                <div>
                  <label class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Stock Initial</label>
                  <input type="number" [(ngModel)]="form.stock" name="stock" required
                         class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-black font-mono focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
                </div>

                <div>
                  <label class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Seuil Alerte</label>
                  <input type="number" [(ngModel)]="form.threshold" name="threshold"
                         class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-black font-mono focus:ring-2 focus:ring-[#0D1B2A]/20 focus:border-[#0D1B2A] outline-none transition-all" placeholder="10">
                </div>

                <div class="col-span-2">
                  <label class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-4 ml-1">Visuel du produit</label>
                  
                  <div class="flex items-start gap-4">
                    <div class="w-32 h-32 rounded-[2rem] bg-[#fcfcfd] border-2 border-dashed border-[#e4e6ea] flex flex-col items-center justify-center overflow-hidden shrink-0 group relative cursor-pointer hover:border-primary transition-all" (click)="triggerImageInput()">
                      @if (form.imageUrl) {
                        <img [src]="form.imageUrl" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                           <mat-icon class="text-white scale-75">sync</mat-icon>
                        </div>
                      } @else {
                        <mat-icon class="text-[#9699a8] mb-2 scale-125">add_a_photo</mat-icon>
                        <span class="text-[8px] font-black text-[#9699a8] uppercase text-center px-4 leading-tight">Importer<br>Image</span>
                      }
                    </div>

                    <div class="flex-1 space-y-4">
                      <div class="relative">
                        <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 scale-75 text-[#9699a8]">link</mat-icon>
                        <input type="text" [(ngModel)]="form.imageUrl" name="imageUrl"
                               class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl pl-11 pr-4 text-[10px] font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="URL de l'image (ex: https://...)">
                      </div>
                      <p class="text-[9px] text-[#9699a8] font-medium px-1 leading-relaxed italic">
                        Conseil: Utilisez une image carrée (ratio 1:1) de haute qualité pour un meilleur rendu visuel sur la boutique.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="col-span-2">
                  <label class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Description</label>
                  <textarea [(ngModel)]="form.description" name="description" rows="3"
                          class="w-full bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all resize-none"></textarea>
                </div>
              </div>

              <div class="flex gap-3 pt-2">
                <button type="button" (click)="closeModal()"
                        class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#5a5e72] bg-[#f0f2f5] hover:bg-[#e4e6ea] transition-all">
                  Annuler
                </button>
                <button type="submit" [disabled]="loading()"
                        class="flex-[2] h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-[#0D1B2A] shadow-lg shadow-[#0D1B2A]/20 hover:bg-[#FF6200] hover:shadow-[#FF6200]/20 transition-all flex items-center justify-center gap-2">
                  @if (loading()) {
                    <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  } @else {
                    <mat-icon class="scale-75">check</mat-icon>
                    Enregistrer
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SupplierProducts implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private dataService = inject(DataService);
  
  public products = computed(() => this.dataService.products$() as OchapProduct[]);
  
  showModal = signal(false);
  editingProduct = signal<OchapProduct | null>(null);
  loading = signal(false);

  form: Partial<OchapProduct> = {
    name: '',
    category: 'Alimentation',
    price: 0,
    stock: 0,
    threshold: 5,
    imageUrl: '',
    description: ''
  };

  private unsub?: Unsubscribe;

  ngOnInit() {
    this.initWatcher();
  }

  async initWatcher() {
    const user = this.authService.user$();
    if (user) {
      // In O'CHAP, we use User UID as Supplier ID for simple routing
      this.unsub = this.dataService.watchSupplierProducts(user.uid);
    }
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  formatPrice(val: number | string): string {
    return Number(val || 0).toLocaleString('fr-FR') + ' FCFA';
  }

  openAddModal() {
    this.editingProduct.set(null);
    this.form = {
      name: '',
      category: 'Alimentation',
      price: 0,
      stock: 0,
      threshold: 5,
      imageUrl: '',
      description: ''
    };
    this.showModal.set(true);
  }

  openEditModal(product: OchapProduct) {
    this.editingProduct.set(product);
    this.form = { ...product };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  triggerImageInput() {
    const url = window.prompt('Entrez l\'URL de l\'image pour ce produit', this.form.imageUrl || '');
    if (url !== null) {
      this.form.imageUrl = url;
    }
  }

  async saveProduct() {
    if (!this.form.name || this.form.price === undefined) return;

    this.loading.set(true);
    try {
      if (this.editingProduct()) {
        await this.dataService.updateProduct(this.editingProduct()!.id, this.form);
      } else {
        await this.dataService.addProduct(this.form);
      }
      this.closeModal();
    } catch (e) {
      console.error('Error saving product:', e);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProduct(id: string) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      await this.dataService.deleteProduct(id);
    }
  }
}
