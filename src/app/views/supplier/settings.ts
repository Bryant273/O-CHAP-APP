import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-supplier-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div>
        <h2 class="text-xl font-black text-[#0D1B2A] tracking-tight uppercase">Paramètres</h2>
        <p class="text-xs text-[#5a5e72] mt-1 font-medium">Gérez votre profil partenaire et vos préférences</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Profile Info -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm space-y-6">
          <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest flex items-center gap-3">
            <mat-icon class="text-[#FF6200]">store</mat-icon>
            Informations boutique
          </h3>

          <div class="space-y-4">
            <div>
              <label for="storeName" class="block text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest mb-1.5 ml-1">Nom de la boutique</label>
              <input id="storeName" type="text" [(ngModel)]="profileData.displayName" class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-4 text-xs font-bold focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
            </div>
            <div>
              <label for="storeEmail" class="block text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest mb-1.5 ml-1">Email de contact</label>
              <input id="storeEmail" type="email" [ngModel]="profileData.email" disabled class="w-full h-12 bg-[#f0f2f5] border border-[#e4e6ea] rounded-2xl px-4 text-xs font-bold text-[#9699a8] outline-none cursor-not-allowed">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="storePhone" class="block text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest mb-1.5 ml-1">Téléphone</label>
                <input id="storePhone" type="text" [(ngModel)]="profileData.phone" class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-4 text-xs font-bold focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
              </div>
              <div>
                <label for="storeCity" class="block text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest mb-1.5 ml-1">Ville</label>
                <input id="storeCity" type="text" [(ngModel)]="profileData.city" class="w-full h-12 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl px-4 text-xs font-bold focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] outline-none transition-all">
              </div>
            </div>
          </div>

          <button (click)="saveProfile()" class="w-full h-14 bg-[#0D1B2A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#0D1B2A]/20 hover:bg-[#FF6200] transition-all active:scale-[0.98] flex items-center justify-center gap-3">
             <mat-icon class="scale-75">save</mat-icon>
             Sauvegarder les modifications
          </button>
        </div>

        <!-- Notifications & Security -->
        <div class="space-y-8">
           <div class="bg-white p-8 rounded-[2.5rem] border border-[#e4e6ea] shadow-sm space-y-6">
              <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest flex items-center gap-3">
                <mat-icon class="text-[#0984e3]">notifications</mat-icon>
                Préférences d'alerte
              </h3>
              
              <div class="space-y-4">
                 <div class="flex items-center justify-between p-4 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl">
                    <div>
                       <p class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-wider">Alertes de stock</p>
                       <p class="text-[9px] text-[#5a5e72] font-medium">Notification quand un produit passe sous 5 unités</p>
                    </div>
                    <div class="w-10 h-6 bg-[#00b894] rounded-full relative cursor-pointer">
                       <div class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                 </div>
                 <div class="flex items-center justify-between p-4 bg-[#fcfcfd] border border-[#e4e6ea] rounded-2xl">
                    <div>
                       <p class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-wider">Nouvelles commandes</p>
                       <p class="text-[9px] text-[#5a5e72] font-medium">Recevoir un email pour chaque nouvelle vente</p>
                    </div>
                    <div class="w-10 h-6 bg-[#00b894] rounded-full relative cursor-pointer">
                       <div class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                 </div>
              </div>
           </div>

           <div class="bg-[#fff3ec] p-8 rounded-[2.5rem] border border-[#FF6200]/20 space-y-4">
              <h4 class="text-[11px] font-black text-[#FF6200] uppercase tracking-widest flex items-center gap-2">
                 <mat-icon class="scale-75">verified_user</mat-icon>
                 Niveau de partenariat
              </h4>
              <p class="text-xs font-bold text-[#0D1B2A]">Vous êtes actuellement un <span class="text-[#FF6200]">Partenaire Premium</span>.</p>
              <p class="text-[10px] text-[#5a5e72] leading-relaxed">Votre compte est vérifié et vous bénéficiez de frais logistiques réduits sur l'ensemble du réseau O'CHAP Afrique.</p>
           </div>

           <div class="bg-[#e8f4fd] p-8 rounded-[2.5rem] border border-[#0984e3]/20 space-y-4">
              <h4 class="text-[11px] font-black text-[#0984e3] uppercase tracking-widest flex items-center gap-2">
                 <mat-icon class="scale-75">assignment_return</mat-icon>
                 Politique de retour O'CHAP
              </h4>
              <p class="text-xs font-bold text-[#0D1B2A]">Délai de retour client : <span class="text-[#0984e3]">14 jours</span>.</p>
              <p class="text-[10px] text-[#5a5e72] leading-relaxed">En tant que partenaire O'CHAP, vous acceptez les conditions de retour standard du réseau pour garantir la satisfaction client optimale.</p>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SupplierSettings implements OnInit {
  public authService = inject(AuthService);
  
  profileData = {
    displayName: 'Diallo Store',
    email: 'test-fournisseur@ochap.com',
    phone: '+225 07 11 22 33',
    city: 'Abidjan'
  };

  ngOnInit() {
    const profile = this.authService.profile$() as Record<string, unknown>;
    if (profile) {
      this.profileData.displayName = (profile['displayName'] as string) || this.profileData.displayName;
      this.profileData.email = (profile['email'] as string) || this.profileData.email;
      this.profileData.phone = (profile['phoneNumber'] as string) || (profile['phone'] as string) || this.profileData.phone;
      this.profileData.city = (profile['city'] as string) || this.profileData.city;
    }
  }

  async saveProfile() {
    const success = await this.authService.updateProfile({
      displayName: this.profileData.displayName,
      phoneNumber: this.profileData.phone,
      city: this.profileData.city,
      businessName: this.profileData.displayName // Also store as businessName for clarity
    });

    if (success) {
      alert('Profil mis à jour avec succès !');
    } else {
      alert('Une erreur est survenue lors de la mise à jour.');
    }
  }
}
