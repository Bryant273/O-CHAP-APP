import { ChangeDetectionStrategy, Component, inject, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DataService, OchapProduct } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-supplier-products',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, RouterLink],
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
              <div class="flex items-center justify-between mb-5">
                <span class="text-sm font-black text-[#FF6200] font-price">{{ formatPrice(p.price) }} FCFA</span>
                <span [class]="p.stock > 0 ? 'text-[#00b894] bg-[#e8fdf5]' : 'text-[#e17055] bg-[#fdedec]'" class="text-[9px] font-black px-2 py-1 rounded-md uppercase border border-current">
                   {{ p.stock > 0 ? p.stock + ' en stock' : 'Rupture' }}
                </span>
              </div>
              
              <a [routerLink]="['/products', p.id]" class="w-full h-10 rounded-xl bg-[#f0f2f5] text-[#0D1B2A] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0D1B2A] hover:text-white transition-all group/btn">
                 <mat-icon class="scale-50 group-hover/btn:scale-75 transition-transform">visibility</mat-icon>
                 Voir plus
              </a>
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
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-[#0D1B2A]/60 backdrop-blur-md" 
               (click)="closeModal()" 
               role="button" 
               aria-label="Fermer la modale" 
               tabindex="0"
               (keydown.enter)="closeModal()"
               (keydown.escape)="closeModal()"></div>
          <form (ngSubmit)="saveProduct()" class="relative bg-white w-full max-w-lg max-h-[85vh] rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(13,27,42,0.3)] animate-fade-in flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="px-8 py-6 border-b border-[#f0f2f5] flex items-center justify-between bg-white shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <mat-icon>{{ editingProduct() ? 'edit' : 'add_box' }}</mat-icon>
                </div>
                <div>
                  <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-wider italic leading-none">
                    {{ editingProduct() ? 'Mise à jour' : 'Nouvel Article' }}
                  </h3>
                  <p class="text-[9px] font-bold text-[#9699a8] uppercase tracking-widest mt-1">Catalogue O'CHAP</p>
                </div>
              </div>
              <button type="button" (click)="closeModal()" class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f0f2f5] transition-all">
                <mat-icon class="scale-75 text-[#9699a8]">close</mat-icon>
              </button>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label for="p-name" class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Nom du produit</label>
                  <input id="p-name" type="text" [(ngModel)]="form.name" name="name" required
                         class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-medium focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
                </div>
                
                <div>
                  <label for="p-cat" class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Catégorie</label>
                  <select id="p-cat" [(ngModel)]="form.category" name="category" required
                          class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-medium focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
                    <!-- Froid & Conservation -->
                    <optgroup label="Froid & Conservation">
                      <option value="frigo">Réfrigérateurs</option>
                      <option value="congel">Congélateurs</option>
                      <option value="cave">Caves à vin</option>
                      <option value="mini">Mini-frigos</option>
                    </optgroup>
                    <!-- Image & Son -->
                    <optgroup label="Image & Son">
                      <option value="tv">Téléviseurs</option>
                      <option value="home">Home Cinéma</option>
                      <option value="barre">Barres de son</option>
                    </optgroup>
                    <!-- Climatisation -->
                    <optgroup label="Climatisation">
                      <option value="clim">Climatiseurs Split</option>
                      <option value="mobile">Climatiseurs mobiles</option>
                      <option value="ventilo">Ventilateurs</option>
                    </optgroup>
                    <!-- Linge & Vaisselle -->
                    <optgroup label="Linge & Vaisselle">
                      <option value="laver">Lave-linge</option>
                      <option value="secher">Sèche-linge</option>
                      <option value="vaisselle">Lave-vaisselle</option>
                    </optgroup>
                    <!-- Cuisine & Cuisson -->
                    <optgroup label="Cuisine & Cuisson">
                      <option value="cuisine">Cuisinières</option>
                      <option value="four">Fours encastrables</option>
                      <option value="micro">Micro-ondes</option>
                    </optgroup>
                    <!-- Petit Électroménager -->
                    <optgroup label="Petit Électroménager">
                      <option value="cafe">Cafetières</option>
                      <option value="mixeur">Mixeurs & Blenders</option>
                      <option value="fer">Fer à repasser</option>
                    </optgroup>
                  </select>
                </div>
                
                <div>
                  <label for="p-price" class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Prix (FCFA)</label>
                  <input id="p-price" type="number" [(ngModel)]="form.price" name="price" required
                         class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-black font-price focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
                </div>

                <div>
                  <label for="p-stock" class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Stock Initial</label>
                  <input id="p-stock" type="number" [(ngModel)]="form.stock" name="stock" required
                         class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-black font-mono focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
                </div>

                <div>
                  <label for="p-thresh" class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Seuil Alerte</label>
                  <input id="p-thresh" type="number" [(ngModel)]="form.threshold" name="threshold"
                         class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl px-4 text-xs font-black font-mono focus:ring-2 focus:ring-[#0D1B2A]/20 focus:border-[#0D1B2A] outline-none transition-all" placeholder="10">
                </div>

                <div class="col-span-2">
                  <h4 class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-4 ml-1">Visuel du produit</h4>
                  
                  <div class="flex items-start gap-4">
                    <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/png, image/jpeg, image/jpg" class="hidden">
                    <button type="button" class="w-32 h-32 rounded-[2rem] bg-[#fcfcfd] border-2 border-dashed border-[#e4e6ea] flex flex-col items-center justify-center overflow-hidden shrink-0 group relative cursor-pointer hover:border-primary transition-all p-0" (click)="fileInput.click()">
                      @if (form.imageUrl) {
                        <img [src]="form.imageUrl" class="w-full h-full object-cover" referrerpolicy="no-referrer" alt="Aperçu du produit">
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                           <mat-icon class="text-white scale-75">sync</mat-icon>
                        </div>
                      } @else {
                        <mat-icon class="text-[#9699a8] mb-2 scale-125">add_a_photo</mat-icon>
                        <span class="text-[8px] font-black text-[#9699a8] uppercase text-center px-4 leading-tight">Importer<br>Image</span>
                      }
                    </button>

                    <div class="flex-1 space-y-4">
                      <div class="relative">
                        <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 scale-75 text-[#9699a8]">link</mat-icon>
                        <input id="p-imgurl" type="text" [(ngModel)]="form.imageUrl" name="imageUrl" aria-label="URL de l'image"
                               class="w-full h-11 bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl pl-11 pr-4 text-[10px] font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="URL ou image importée">
                      </div>
                      <p class="text-[9px] text-[#9699a8] font-medium px-1 leading-relaxed italic">
                        Glissez-déposez ou cliquez sur le cadre pour importer vos photos (PNG, JPG). L'image est stockée localement pour un affichage instantané.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="col-span-2">
                  <label for="p-desc" class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest block mb-1.5 ml-1">Description</label>
                  <textarea id="p-desc" [(ngModel)]="form.description" name="description" rows="3"
                          class="w-full bg-[#fcfcfd] border border-[#e4e6ea] rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all resize-none"></textarea>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-8 py-6 border-t border-[#f0f2f5] bg-white shrink-0 flex gap-3">
              <button type="button" (click)="closeModal()"
                      class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#5a5e72] bg-[#f8f9fa] hover:bg-[#f0f2f5] border border-[#e4e6ea] transition-all">
                Annuler
              </button>
              <button type="submit" [disabled]="loading()"
                      class="flex-[2] h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-primary shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-95">
                @if (loading()) {
                  <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                } @else {
                  <mat-icon class="scale-75">verified</mat-icon>
                  Confirmer
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
    category: 'frigo',
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
    return Number(val || 0).toLocaleString('fr-FR');
  }

  openAddModal() {
    this.editingProduct.set(null);
    this.form = {
      name: '',
      category: 'frigo',
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.form.imageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
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
