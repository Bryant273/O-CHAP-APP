import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface font-sans pb-20">
      <!-- Header Area -->
      <header class="bg-white border-b border-surface-2 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <button routerLink="/" class="flex items-center gap-2 text-muted hover:text-ink transition-all text-xs font-black uppercase tracking-widest group">
          <mat-icon class="scale-75 group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
          Retour Boutique
        </button>
        <div class="oc-brand !text-xl">O'<span>CHAP</span></div>
        <div class="w-24"></div> <!-- Spacer for balance -->
      </header>

      <main class="max-w-4xl mx-auto px-6 py-12">
        <!-- Profile Hero -->
        <div class="bg-dark rounded-3xl p-8 md:p-12 text-white relative overflow-hidden mb-12">
          <div class="absolute inset-0 z-0 opacity-20">
             <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary rounded-full blur-[100px]"></div>
          </div>
          
          <div class="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div class="relative group">
              <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
                @if (authService.user$()?.photoURL) {
                  <img [src]="authService.user$()?.photoURL" alt="Avatar" class="w-full h-full object-cover">
                } @else {
                  <div class="w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-black">
                    {{ authService.user$()?.displayName?.charAt(0) }}
                  </div>
                }
              </div>
              <button class="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center border-4 border-dark hover:scale-110 transition-transform">
                <mat-icon class="scale-75">photo_camera</mat-icon>
              </button>
            </div>
            
            <div class="text-center md:text-left flex-1">
              <h1 class="text-3xl font-black tracking-tight mb-2 uppercase">{{ authService.user$()?.displayName }}</h1>
              <p class="text-white/60 font-mono text-sm mb-4">{{ authService.user$()?.email }}</p>
              <div class="flex flex-wrap justify-center md:justify-start gap-3">
                <span class="px-4 py-1 bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Compte {{ (authService.profile$()?.['role'] || 'client') }}
                </span>
                <span class="px-4 py-1 bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Vérifié
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-6 border-b border-surface-2 mb-10 overflow-x-auto no-scrollbar">
          <button (click)="activeTab.set('general')" 
                  [class.text-primary]="activeTab() === 'general'"
                  [class.border-primary]="activeTab() === 'general'"
                  class="py-4 px-2 border-b-2 border-transparent text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer">
            Général
          </button>
          <button (click)="activeTab.set('security')" 
                  [class.text-primary]="activeTab() === 'security'"
                  [class.border-primary]="activeTab() === 'security'"
                  class="py-4 px-2 border-b-2 border-transparent text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer">
            Sécurité
          </button>
          <button (click)="activeTab.set('preferences')" 
                  [class.text-primary]="activeTab() === 'preferences'"
                  [class.border-primary]="activeTab() === 'preferences'"
                  class="py-4 px-2 border-b-2 border-transparent text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer">
            Préférences
          </button>
          <button (click)="activeTab.set('billing')" 
                  [class.text-primary]="activeTab() === 'billing'"
                  [class.border-primary]="activeTab() === 'billing'"
                  class="py-4 px-2 border-b-2 border-transparent text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer">
            Coordonnées
          </button>
        </div>

        <!-- Tab Content -->
        <div class="animate-fade-up">
          @if (activeTab() === 'general') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-6">
                <div class="flex flex-col gap-1.5">
                  <label for="fullName" class="text-[10px] font-black uppercase text-muted tracking-widest ml-1">Nom Complet</label>
                  <input id="fullName" type="text" [value]="authService.user$()?.displayName" class="w-full bg-white border border-surface-2 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all">
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="email" class="text-[10px] font-black uppercase text-muted tracking-widest ml-1">Email</label>
                  <input id="email" type="email" [value]="authService.user$()?.email" disabled class="w-full bg-surface-2 border border-surface-2 rounded-2xl px-5 py-3.5 text-sm font-bold opacity-60">
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="phone" class="text-[10px] font-black uppercase text-muted tracking-widest ml-1">Téléphone</label>
                  <input id="phone" type="tel" placeholder="+241 01 02 03 04" class="w-full bg-white border border-surface-2 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all">
                </div>

                @if (authService.user$()?.email?.toLowerCase() !== 'acherie812@gmail.com') {
                  <div class="pt-6 mt-6 border-t border-surface-2">
                    <h3 class="text-[11px] font-black text-red-500 uppercase tracking-widest mb-2">Zone de danger</h3>
                    <p class="text-[10px] text-muted mb-4">La suppression de votre compte est irréversible. Toutes vos données seront perdues.</p>
                    <button (click)="confirmDelete()" class="px-6 py-2.5 rounded-xl border border-red-200 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">
                      Supprimer mon compte
                    </button>
                  </div>
                }
              </div>
              
              <div class="bg-surface-2 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                  <mat-icon class="text-primary">info_outline</mat-icon>
                </div>
                <h3 class="text-sm font-black text-ink uppercase tracking-wider mb-2">Note sur votre profil</h3>
                <p class="text-[11px] text-muted font-medium leading-relaxed">Vos informations sont utilisées pour faciliter vos commandes et livraisons. O'CHAP garantit la confidentialité de vos données.</p>
              </div>
            </div>
          }

          @if (activeTab() === 'security') {
            <div class="space-y-6 max-w-xl">
              <div class="bg-white border border-surface-2 rounded-3xl p-6 flex items-center justify-between group hover:border-primary transition-all">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-muted group-hover:text-primary transition-colors">
                    <mat-icon>lock_reset</mat-icon>
                  </div>
                  <div>
                    <h3 class="text-xs font-black text-ink uppercase tracking-wider">Changer le mot de passe</h3>
                    <p class="text-[10px] text-muted">Dernière modification il y a 3 mois</p>
                  </div>
                </div>
                <mat-icon class="text-muted scale-75 group-hover:translate-x-1 transition-transform">chevron_right</mat-icon>
              </div>

              <div class="bg-white border border-surface-2 rounded-3xl p-6 flex items-center justify-between group hover:border-primary transition-all">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-muted group-hover:text-primary transition-colors">
                    <mat-icon>phonelink_lock</mat-icon>
                  </div>
                  <div>
                    <h3 class="text-xs font-black text-ink uppercase tracking-wider">Authentification à deux facteurs</h3>
                    <p class="text-[10px] text-red-500 font-bold uppercase">Non activé</p>
                  </div>
                </div>
                <mat-icon class="text-muted scale-75 group-hover:translate-x-1 transition-transform">chevron_right</mat-icon>
              </div>
            </div>
          }

          @if (activeTab() === 'preferences') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white border border-surface-2 rounded-3xl p-6">
                <h3 class="text-[10px] font-black uppercase text-muted tracking-widest mb-6">Notifications Email</h3>
                <div class="space-y-4">
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-xs font-bold text-ink">Alertes de stock</span>
                    <input type="checkbox" checked class="w-4 h-4 accent-primary">
                  </label>
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-xs font-bold text-ink">Nouvelles collections</span>
                    <input type="checkbox" class="w-4 h-4 accent-primary">
                  </label>
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-xs font-bold text-ink">Promotions exclusives</span>
                    <input type="checkbox" checked class="w-4 h-4 accent-primary">
                  </label>
                </div>
              </div>

              <div class="bg-white border border-surface-2 rounded-3xl p-6">
                <h3 class="text-[10px] font-black uppercase text-muted tracking-widest mb-6">Affichage</h3>
                <div class="space-y-4">
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-xs font-bold text-ink">Mode Sombre</span>
                    <input type="checkbox" class="w-4 h-4 accent-primary">
                  </label>
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="text-xs font-bold text-ink">Lecture automatique vidéos</span>
                    <input type="checkbox" checked class="w-4 h-4 accent-primary">
                  </label>
                </div>
              </div>
            </div>
          }

          @if (activeTab() === 'billing') {
            <div class="space-y-8">
              <div class="bg-white border border-surface-2 rounded-3xl p-8">
                <h3 class="text-[10px] font-black uppercase text-muted tracking-widest mb-8">Adresse de Livraison</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="md:col-span-2 flex flex-col gap-1.5">
                    <label for="pAddress" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Rue / Quartier</label>
                    <input id="pAddress" type="text" placeholder="Ex: Akanda, Batterie IV" class="w-full bg-surface-2 border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-primary transition-all">
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label for="pCity" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Ville</label>
                    <input id="pCity" type="text" placeholder="Libreville" class="w-full bg-surface-2 border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-primary transition-all">
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label for="pBP" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Code Postal / BP</label>
                    <input id="pBP" type="text" placeholder="BP 1234" class="w-full bg-surface-2 border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-primary transition-all">
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="mt-12 flex justify-end gap-4">
          <button class="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted hover:bg-surface-2 transition-all">Annuler</button>
          <button class="px-8 py-3 bg-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary shadow-xl shadow-navy/20 transition-all active:scale-95">
            Enregistrer les modifications
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-up { animation: fade-up 0.5s ease-out; }
  `]
})
export class ProfileComponent {
  public authService = inject(AuthService);
  private router = inject(Router);
  activeTab = signal<string>('general');

  async confirmDelete() {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      try {
        await this.authService.deleteAccount();
        this.router.navigate(['/']);
      } catch (error: unknown) {
        const err = error as { message?: string };
        alert(err.message || 'Une erreur est survenue lors de la suppression du compte.');
      }
    }
  }
}
