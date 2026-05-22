import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { DataService } from '../../services/data.service';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  phone: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#f8f9fa] font-sans pb-24">
      <!-- Navbar / Header -->
      <header class="bg-white border-b border-[#e4e6ea] sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <button routerLink="/" class="flex items-center gap-2 text-muted hover:text-ink transition-all text-xs font-black uppercase tracking-widest group">
          <mat-icon class="scale-75 group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
          Annuler
        </button>
        <div class="oc-brand !text-xl">O'<span>CHAP</span></div>
        <div class="text-[10px] font-black uppercase tracking-widest text-[#5a5e72] bg-[#f0f2f5] px-3 py-1.5 rounded-full">
          Sécurisé SSL
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-12">
        <!-- Title & Stepper Progress -->
        <div class="text-center mb-12">
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight uppercase italic duration-300">Finaliser ma commande</h2>
          <p class="text-xs text-muted mt-2 font-medium">Suivez les étapes pour valider vos achats O'CHAP</p>
          
          <!-- Progression Bar with dynamic steps -->
          <div class="mt-8 relative max-w-lg mx-auto">
            <div class="absolute top-1/2 left-0 right-0 h-1 bg-[#e4e6ea] -translate-y-1/2 rounded-full z-0"></div>
            <div class="absolute top-1/2 left-0 h-1 bg-[#FF6200] -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                 [style.width.%]="getProgressPercentage()"></div>
            
            <div class="relative z-10 flex justify-between">
              @for (step of steps; track step.id; let i = $index) {
                <button (click)="goToStep(i)" [disabled]="i > maxVisitedStep()"
                        class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                        [class]="currentStep() >= i 
                          ? 'bg-[#FF6200] text-white shadow-lg shadow-[#FF6200]/20' 
                          : 'bg-white border-2 border-[#e4e6ea] text-muted hover:border-[#FF6200]/50'">
                  <mat-icon class="scale-75">{{ step.icon }}</mat-icon>
                </button>
              }
            </div>
            
            <div class="flex justify-between mt-2 px-1">
              @for (step of steps; track step.id; let i = $index) {
                <span class="text-[9px] font-black uppercase tracking-wider"
                      [class]="currentStep() === i ? 'text-[#FF6200]' : 'text-muted'">
                  {{ step.label }}
                </span>
              }
            </div>
          </div>
        </div>

        @if (cartItems().length === 0) {
          <div class="bg-white border rounded-[2.5rem] p-16 text-center shadow-sm max-w-lg mx-auto">
            <mat-icon class="scale-[2.5] text-primary mb-6 animate-pulse">shopping_bag</mat-icon>
            <h3 class="text-base font-black uppercase tracking-widest">Votre panier est vide</h3>
            <p class="text-xs text-muted mt-2">Vous devez ajouter des articles avant de passer à la caisse.</p>
            <button routerLink="/" class="mt-8 px-6 py-3 bg-[#0D1B2A] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#FF6200] transition-all">
              Boutique
            </button>
          </div>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div class="lg:col-span-2 space-y-6">
              
              <!-- STEP 0: DELIVERY LOCATION -->
              @if (currentStep() === 0) {
                <div class="bg-white border border-[#e4e6ea] rounded-[2.5rem] p-8 shadow-sm space-y-6">
                  <div>
                    <span class="text-[10px] font-black text-[#FF6200] uppercase tracking-[0.2em] block mb-1">Étape 1 sur 3</span>
                    <h3 class="text-xl font-black text-[#0D1B2A] uppercase italic">Adresse & Lieu de Livraison</h3>
                  </div>

                  <!-- Saved Addresses List -->
                  <div class="space-y-3">
                    <p class="text-xs font-black text-ink uppercase tracking-wider">Sélectionner un lieu de livraison :</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      @for (addr of userAddresses(); track addr.id) {
                        <div (click)="selectAddress(addr)"
                             [class]="selectedAddress()?.id === addr.id ? 'border-2 border-[#FF6200] bg-orange-50/20' : 'border border-[#e4e6ea] hover:border-[#FF6200]/40'"
                             class="p-5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between relative group">
                          <div>
                            <div class="flex items-center gap-2 mb-2">
                              <span class="w-2 h-2 rounded-full" [class]="selectedAddress()?.id === addr.id ? 'bg-[#FF6200]' : 'bg-muted'"></span>
                              <span class="text-xs font-black text-[#0D1B2A] uppercase tracking-wider">{{ addr.label }}</span>
                            </div>
                            <p class="text-[11px] font-bold text-[#5a5e72] leading-tight mb-1">{{ addr.street }}</p>
                            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-[#0d1b2a]">{{ addr.city }}</span>
                          </div>
                        </div>
                      } @empty {
                        <div class="col-span-2 p-8 text-center border-2 border-dashed border-[#e4e6ea] rounded-2xl bg-[#fafbfc]">
                          <mat-icon class="scale-115 text-muted mb-2">location_off</mat-icon>
                          <p class="text-[11px] text-muted">Aucune adresse enregistrée sur votre compte.</p>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Add Address Shortcut Accordion -->
                  <div class="border-t border-[#e4e6ea] pt-6 space-y-4">
                    @if (!showForm()) {
                      <button (click)="showForm.set(true)" class="text-xs font-black text-[#FF6200] uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer">
                        <mat-icon class="scale-75">add_location_alt</mat-icon> Ajouter ou renseigner une nouvelle adresse
                      </button>
                    } @else {
                      <div class="p-6 border border-[#FF6200]/20 rounded-2xl bg-[#fafbfc] space-y-4">
                        <h4 class="text-xs font-black text-[#FF6200] uppercase tracking-wider">Nouvelle Adresse</h4>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div class="flex flex-col gap-1.5">
                            <label for="shAddress" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Libellé (ex: Bureau Abidjan, Domicile)</label>
                            <input id="shAddress" type="text" [(ngModel)]="newAddr.label" placeholder="Domicile" class="h-10 text-xs bg-white border border-[#e4e6ea] rounded-xl px-4 outline-none focus:border-[#FF6200]/50 font-bold">
                          </div>

                          <div class="flex flex-col gap-1.5">
                            <label for="shCity" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Ville / Commune</label>
                            <select id="shCity" [(ngModel)]="newAddr.city" class="h-10 text-xs bg-white border border-[#e4e6ea] rounded-xl px-4 outline-none focus:border-[#FF6200]/50 font-bold">
                              <option value="" disabled selected>Sélectionner une ville</option>
                              <option value="Abidjan - Cocody">Abidjan - Cocody (1 500 XOF)</option>
                              <option value="Abidjan - Marcory">Abidjan - Marcory (1 500 XOF)</option>
                              <option value="Abidjan - Plateau">Abidjan - Plateau (1 500 XOF)</option>
                              <option value="Abidjan - Yopougon">Abidjan - Yopougon (1 500 XOF)</option>
                              <option value="Bouaké">Bouaké (2 500 XOF)</option>
                              <option value="Yamoussoukro">Yamoussoukro (2 500 XOF)</option>
                              <option value="San-Pédro">San-Pédro (2 500 XOF)</option>
                              <option value="Autre ville">Autre ville hors d'Abidjan (2 500 XOF)</option>
                            </select>
                          </div>

                          <div class="sm:col-span-2 flex flex-col gap-1.5">
                            <label for="shStreet" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Adresse détaillée (Indications / Quartier)</label>
                            <input id="shStreet" type="text" [(ngModel)]="newAddr.street" placeholder="Angré 8ème tranche, après la pharmacie" class="h-10 text-xs bg-white border border-[#e4e6ea] rounded-xl px-4 outline-none focus:border-[#FF6200]/50 font-bold">
                          </div>

                          <div class="flex flex-col gap-1.5">
                            <label for="shPhone" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Téléphone de Livraison</label>
                            <input id="shPhone" type="tel" [(ngModel)]="newAddr.phone" placeholder="+225 07 00 00 00 00" class="h-10 text-xs bg-white border border-[#e4e6ea] rounded-xl px-4 outline-none focus:border-[#FF6200]/50 font-bold">
                          </div>
                        </div>

                        <div class="flex justify-end gap-2 pt-2">
                          <button (click)="showForm.set(false)" class="px-4 py-2 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-wider text-[#5a5e72] hover:bg-slate-200 transition-all">Annuler</button>
                          <button (click)="saveNewAddressShortcut()" class="px-4 py-2 bg-[#FF6200] text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-orange-600 transition-all">Enregistrer</button>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Navigation controls -->
                  <div class="pt-6 border-t border-[#e4e6ea] flex justify-end">
                    <button (click)="nextStep()" [disabled]="!selectedAddress()"
                            class="px-8 h-12 bg-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary transition-all disabled:opacity-50">
                      Continuer <mat-icon class="scale-75">arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              }

              <!-- STEP 1: PAYMENT METHOD -->
              @if (currentStep() === 1) {
                <div class="bg-white border border-[#e4e6ea] rounded-[2.5rem] p-8 shadow-sm space-y-6">
                  <div>
                    <span class="text-[10px] font-black text-[#FF6200] uppercase tracking-[0.2em] block mb-1">Étape 2 sur 3</span>
                    <h3 class="text-xl font-black text-[#0D1B2A] uppercase italic">Choix du Moyen de Paiement</h3>
                  </div>

                  <!-- Cash Only Choice -->
                  <div class="p-6 border-2 border-[#FF6200] bg-orange-50/10 rounded-2xl flex items-center gap-4">
                    <div class="w-12 h-12 bg-emerald-500 rounded-xl text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                      <mat-icon class="scale-110">payments</mat-icon>
                    </div>
                    <div class="flex-1">
                      <h4 class="text-sm font-black text-ink">Paiement en espèces (Espèces)</h4>
                      <p class="text-[10px] text-muted">Réglez en toute sécurité directement lors de la livraison (par défaut).</p>
                    </div>
                    <mat-icon class="text-emerald-500 scale-110">check_circle</mat-icon>
                  </div>

                  <p class="text-[10px] text-muted leading-relaxed italic block mt-2">Note: D'autres moyens de paiement (Mobile Money, Carte bancaire) seront bientôt disponibles au sein de la région O'CHAP.</p>

                  <!-- Navigation controls -->
                  <div class="pt-6 border-t border-[#e4e6ea] flex justify-between">
                    <button (click)="prevStep()"
                            class="px-6 h-12 bg-slate-100 text-muted rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                      <mat-icon class="scale-75">arrow_back</mat-icon> Précédent
                    </button>
                    <button (click)="nextStep()"
                            class="px-8 h-12 bg-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary transition-all">
                      Continuer <mat-icon class="scale-75">arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              }

              <!-- STEP 2: SUMMARY & SUBMIT -->
              @if (currentStep() === 2) {
                <div class="bg-white border border-[#e4e6ea] rounded-[2.5rem] p-8 shadow-sm space-y-8 animate-fade-in">
                  <div>
                    <span class="text-[10px] font-black text-[#FF6200] uppercase tracking-[0.2em] block mb-1">Dernière étape</span>
                    <h3 class="text-xl font-black text-[#0D1B2A] uppercase italic">Récapitulatif de Commande</h3>
                  </div>

                  <!-- Delivery & Buyer Recap -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[#e4e6ea] pb-8">
                    <div class="space-y-3">
                      <h4 class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest">Lieu de livraison</h4>
                      <div class="flex items-start gap-3">
                        <mat-icon class="text-[#FF6200] mt-0.5 scale-90">location_on</mat-icon>
                        <div>
                          <p class="text-xs font-black text-[#0D1B2A]">{{ selectedAddress()?.label }}</p>
                          <p class="text-[11px] font-semibold text-[#5a5e72] mt-0.5">{{ selectedAddress()?.street }}</p>
                          <p class="text-[10px] font-black text-primary uppercase mt-1 tracking-wider">{{ selectedAddress()?.city }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="space-y-3">
                      <h4 class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest">Acheteur & Contacts</h4>
                      <div class="flex items-start gap-3">
                        <mat-icon class="text-[#0D1B2A] mt-0.5 scale-90">person_outline</mat-icon>
                        <div>
                          <p class="text-xs font-black text-[#0D1B2A]">{{ authService.profile$()?.['name'] || 'Client OCHAP' }}</p>
                          <p class="text-[11px] font-semibold text-[#5a5e72] mt-0.5">{{ authService.user$()?.email }}</p>
                          @if (selectedAddress()?.phone) {
                            <p class="text-[11px] font-black text-emerald-600 mt-1 flex items-center gap-1">
                              <mat-icon class="scale-50">phone</mat-icon> {{ selectedAddress()?.phone }}
                            </p>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Cart Items with Seller Name inside recap -->
                  <div class="space-y-4">
                    <h4 class="text-[10px] font-black text-[#5a5e72] uppercase tracking-widest">Articles</h4>
                    <div class="space-y-3">
                      @for (item of cartItems(); track item.id) {
                        <div class="flex items-center gap-4 p-4 border border-[#e4e6ea] rounded-2xl bg-[#fafbfc]">
                          <img [src]="item.imageUrl || 'https://picsum.photos/seed/'+item.id+'/100/100'" [alt]="item.name" class="w-12 h-12 rounded-xl object-cover" referrerpolicy="no-referrer">
                          <div class="flex-1 min-w-0">
                            <h5 class="text-xs font-black text-[#0D1B2A] truncate">{{ item.name }}</h5>
                            <!-- Seller Details fully displayed -->
                            <p class="text-[10px] text-emerald-700 font-black mt-0.5 flex items-center gap-0.5">
                              <mat-icon class="scale-50">verified_user</mat-icon> Vendeur agréé : {{ $any(item).supplierName || "O'CHAP Distributeur" }}
                            </p>
                          </div>
                          <div class="text-right shrink-0">
                            <p class="text-xs font-black text-[#FF6200] font-price">{{ formatPrice(item.price) }} XOF</p>
                            <p class="text-[10px] text-muted mt-0.5 font-bold">Qté: x{{ item.quantity }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Navigation controls -->
                  <div class="pt-6 border-t border-[#e4e6ea] flex justify-between">
                    <button (click)="prevStep()" [disabled]="processing()"
                            class="px-6 h-12 bg-slate-100 text-muted rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                      <mat-icon class="scale-75">arrow_back</mat-icon> Précédent
                    </button>
                    <button (click)="placeOrder()" [disabled]="processing()"
                            class="px-10 h-14 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95">
                      @if (processing()) {
                        <div class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      } @else {
                        <mat-icon class="scale-75">check_circle</mat-icon> Valider la Commande
                      }
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- CART PRICE RECAP PANEL (Right side on desktop) -->
            <div class="bg-white border border-[#e4e6ea] rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-wider italic">Facturation</h3>
              
              <div class="space-y-3.5 text-xs">
                <div class="flex justify-between text-[#5a5e72] font-semibold">
                  <span>Sous-total articles</span>
                  <span class="font-price font-bold text-[#0D1B2A]">{{ formatPrice(cartSubtotal()) }} XOF</span>
                </div>
                
                <div class="flex justify-between text-[#5a5e72] font-semibold items-center">
                  <span>Frais de livraison</span>
                  <span class="font-price font-bold" [class]="deliveryFee() > 0 ? 'text-[#0D1B2A]' : 'text-muted italic'">
                    {{ deliveryFee() > 0 ? formatPrice(deliveryFee()) + ' XOF' : "Déterminé par l'adresse" }}
                  </span>
                </div>

                <div class="pt-4 border-t border-[#e4e6ea] flex justify-between items-end">
                  <span class="text-[10px] font-black uppercase tracking-widest text-[#0D1B2A]">Montant TOTAL</span>
                  <span class="text-xl font-black text-[#FF6200] font-price tracking-tighter">{{ formatPrice(cartSubtotal() + deliveryFee()) }} XOF</span>
                </div>
              </div>

              <!-- Extra assurances block -->
              <div class="bg-[#f8f9fa] rounded-2xl p-4 flex gap-3 border border-[#e4e6ea]">
                <mat-icon class="text-emerald-500 scale-90">verified</mat-icon>
                <div>
                  <h5 class="text-[10px] font-black text-ink uppercase tracking-wide">Garantie O'CHAP</h5>
                  <p class="text-[9px] text-muted italic mt-0.5">Livraison ultra rapide et paiement en espèces fiable 100% sécurisé.</p>
                </div>
              </div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `]
})
export class CheckoutComponent implements OnInit {
  public authService = inject(AuthService);
  private cartService = inject(CartService);
  private dataService = inject(DataService);
  private router = inject(Router);

  steps = [
    { id: 'shipping', label: 'Livraison', icon: 'local_shipping' },
    { id: 'payment', label: 'Paiement', icon: 'payment' },
    { id: 'recap', label: 'Validation', icon: 'fact_check' }
  ];

  currentStep = signal(0);
  maxVisitedStep = signal(0);
  processing = signal(false);

  // Address variables
  userAddresses = computed(() => {
    const profile = this.authService.profile$() as Record<string, unknown>;
    return (profile?.['addresses'] as Address[]) || [];
  });

  selectedAddress = signal<Address | null>(null);
  showForm = signal(false);

  newAddr = {
    label: '',
    street: '',
    city: 'Abidjan - Cocody',
    phone: ''
  };

  // Cart values
  cartItems = computed(() => this.cartService.items$());
  cartSubtotal = computed(() => this.cartService.subtotal());

  deliveryFee = computed(() => {
    const sel = this.selectedAddress();
    if (!sel) return 0;
    const city = sel.city || '';
    return city.toLowerCase().includes('abidjan') ? 1500 : 2500;
  });

  ngOnInit() {
    // Select first address by default if exists
    const list = this.userAddresses();
    if (list.length > 0) {
      this.selectedAddress.set(list[0]);
    }
  }

  getProgressPercentage() {
    return (this.currentStep() / (this.steps.length - 1)) * 100;
  }

  goToStep(index: number) {
    if (index <= this.maxVisitedStep()) {
      this.currentStep.set(index);
    }
  }

  nextStep() {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => {
        const next = s + 1;
        if (next > this.maxVisitedStep()) {
          this.maxVisitedStep.set(next);
        }
        return next;
      });
    }
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  selectAddress(address: Address) {
    this.selectedAddress.set(address);
  }

  async saveNewAddressShortcut() {
    if (!this.newAddr.label || !this.newAddr.street || !this.newAddr.city) {
      alert('Veuillez remplir au moins le libellé, la rue/quartier et la ville de livraison.');
      return;
    }

    const createdAddr: Address = {
      id: 'addr_' + Date.now(),
      label: this.newAddr.label,
      street: this.newAddr.street,
      city: this.newAddr.city,
      phone: this.newAddr.phone || (this.authService.profile$()?.['phone'] as string) || ''
    };

    const updated = [...this.userAddresses(), createdAddr];
    
    // Save to user profile via Auth service
    const success = await this.authService.updateProfile({
      addresses: updated as unknown[]
    });

    if (success) {
      this.selectedAddress.set(createdAddr);
      this.newAddr = {
        label: '',
        street: '',
        city: 'Abidjan - Cocody',
        phone: ''
      };
      this.showForm.set(false);
    } else {
      alert("Erreur lors de l'enregistrement de l'adresse de livraison.");
    }
  }

  formatPrice(val: number): string {
    return Number(val).toLocaleString('fr-FR');
  }

  async placeOrder() {
    const items = this.cartItems();
    const selAddress = this.selectedAddress();
    if (items.length === 0 || !selAddress) return;

    this.processing.set(true);
    const user = this.authService.user$();
    const profile = this.authService.profile$() as Record<string, unknown>;

    const orderPayload = {
      customerName: (profile?.['name'] as string) || (profile?.['displayName'] as string) || user?.email || 'Acheteur',
      customerUid: user?.uid || '',
      deliveryAddress: selAddress.street,
      deliveryZone: selAddress.city,
      phoneNumber: selAddress.phone || (profile?.['phone'] as string) || '',
      paymentMethod: 'Espèces',
      deliveryFee: this.deliveryFee(),
      items: items.map(i => {
        const item = i as unknown as Record<string, unknown>;
        return {
          id: item['id'] as string,
          name: item['name'] as string,
          price: item['price'] as number,
          quantity: item['quantity'] as number,
          imageUrl: (item['imageUrl'] as string) || '',
          category: (item['category'] as string) || 'Général',
          supplierId: (item['supplierId'] as string) || '',
          supplierName: (item['supplierName'] as string) || ''
        };
      }),
      totalAmount: this.cartSubtotal() + this.deliveryFee()
    };

    const success = await this.dataService.placeOrder(orderPayload);
    if (success) {
      this.cartService.clearCart();
      alert('Félicitations ! Votre commande a été enregistrée avec succès. Vous pouvez maintenant la suivre en temps réel !');
      this.router.navigate(['/orders']);
    } else {
      alert("Une erreur est survenue lors de l'enregistrement de votre commande. Veuillez vérifier vos stocks.");
      this.processing.set(false);
    }
  }
}
