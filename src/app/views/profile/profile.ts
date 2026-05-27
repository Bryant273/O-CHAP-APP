import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  phone: string;
}

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
          <button (click)="activeTab.set('sav')" 
                  [class.text-primary]="activeTab() === 'sav'"
                  [class.border-primary]="activeTab() === 'sav'"
                  class="py-4 px-2 border-b-2 border-transparent text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer">
            Mes Réclamations
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
            <div class="space-y-8 animate-fade-up">
              <!-- Addresses List -->
              <div class="bg-white border border-surface-2 rounded-3xl p-8">
                <div class="flex items-center justify-between mb-8">
                  <div>
                    <h3 class="text-[10px] font-black uppercase text-muted tracking-widest">Mes Adresses Enregistrées</h3>
                    <p class="text-[10px] text-muted font-normal mt-1">Gérez vos lieux de livraison pour passer des commandes rapidement.</p>
                  </div>
                  @if (!showAddForm()) {
                    <button (click)="showAddForm.set(true)" class="bg-[#FF6200] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-[#FF6200]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                      <mat-icon class="scale-50">add_location</mat-icon> Ajouter
                    </button>
                  }
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (addr of addresses(); track addr.id) {
                    <div class="p-6 border border-surface-2 rounded-2xl hover:border-primary/30 transition-all flex flex-col justify-between relative group bg-surface-1">
                      <div>
                        <div class="flex items-center gap-2 mb-3">
                          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                          <span class="text-xs font-black text-ink uppercase tracking-wider">{{ addr.label }}</span>
                        </div>
                        <p class="text-xs font-bold text-[#0D1B2A] mb-1">{{ addr.street }}</p>
                        <p class="text-[11px] font-medium text-muted mb-2 uppercase tracking-wide">{{ addr.city }}</p>
                        @if (addr.phone) {
                          <p class="text-[10px] font-semibold text-[#5a5e72] flex items-center gap-1">
                            <mat-icon class="scale-50 text-muted">phone</mat-icon> {{ addr.phone }}
                          </p>
                        }
                      </div>

                      <div class="mt-4 pt-3 border-t border-surface-2 flex justify-end">
                        <button (click)="deleteAddress(addr.id)" class="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 hover:underline cursor-pointer">
                          <mat-icon class="scale-[0.6]">delete_outline</mat-icon> Supprimer
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div class="col-span-full py-12 text-center border-2 border-dashed border-surface-2 rounded-2xl bg-surface-1">
                      <mat-icon class="scale-125 text-muted mb-3">location_off</mat-icon>
                      <h4 class="text-xs font-black text-[#0d1b2a] uppercase tracking-wide">Aucune adresse enregistrée</h4>
                      <p class="text-[10px] text-muted mt-1 leading-normal">Ajoutez des lieux de livraison à Abidjan ou à l'intérieur pour commander vos produits.</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Add Address Form -->
              @if (showAddForm()) {
                <div class="bg-white border-2 border-primary/20 rounded-3xl p-8 animate-fade-up">
                  <h3 class="text-[10px] font-black uppercase text-primary tracking-widest mb-6 flex items-center gap-1.5">
                    <mat-icon class="scale-75">add_location_alt</mat-icon> Nouvelle Adresse de Livraison
                  </h3>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-1.5">
                      <label for="addrLabel" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Nom de l'adresse (ex: Domicile, Bureau)</label>
                      <input id="addrLabel" type="text" [(ngModel)]="newAddressLabel" name="addrLabel" placeholder="Ex: Maison Abidjan, Ma Ville" class="w-full bg-surface-2 border-transparent rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all">
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label for="addrCity" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Ville / Commune</label>
                      <select id="addrCity" [(ngModel)]="newAddressCity" name="addrCity" class="w-full bg-surface-2 border-transparent rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all">
                        <option value="" disabled selected>Sélectionner une ville / commune</option>
                        <option value="Abidjan - Cocody">Abidjan - Cocody (1 500 XOF)</option>
                        <option value="Abidjan - Marcory">Abidjan - Marcory (1 500 XOF)</option>
                        <option value="Abidjan - Plateau">Abidjan - Plateau (1 500 XOF)</option>
                        <option value="Abidjan - Yopougon">Abidjan - Yopougon (1 500 XOF)</option>
                        <option value="Abidjan - Koumassi">Abidjan - Koumassi (1 500 XOF)</option>
                        <option value="Abidjan - Treichville">Abidjan - Treichville (1 500 XOF)</option>
                        <option value="Abidjan - Bingerville">Abidjan - Bingerville (1 500 XOF)</option>
                        <option value="Abidjan - Port-Bouët">Abidjan - Port-Bouët (1 500 XOF)</option>
                        <option value="Abidjan - Abobo">Abidjan - Abobo (1 500 XOF)</option>
                        <option value="Abidjan - Songon">Abidjan - Songon (1 500 XOF)</option>
                        <option value="Bouaké">Bouaké (2 500 XOF)</option>
                        <option value="Yamoussoukro">Yamoussoukro (2 500 XOF)</option>
                        <option value="San-Pédro">San-Pédro (2 500 XOF)</option>
                        <option value="Korhogo">Korhogo (2 500 XOF)</option>
                        <option value="Daloa">Daloa (2 500 XOF)</option>
                        <option value="Man">Man (2 500 XOF)</option>
                        <option value="Gagnoa">Gagnoa (2 500 XOF)</option>
                        <option value="Autre ville">Hors d'Abidjan - Autre (2 500 XOF)</option>
                      </select>
                    </div>

                    <div class="md:col-span-2 flex flex-col gap-1.5">
                      <label for="addrStreet" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Adresse détaillée (Quartier, Rue, Porte, Indications)</label>
                      <input id="addrStreet" type="text" [(ngModel)]="newAddressStreet" name="addrStreet" placeholder="Ex: Cocody Angré 8ème tranche, à côté de la pharmacie" class="w-full bg-surface-2 border-transparent rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all">
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label for="addrPhone" class="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Numéro de Téléphone pour cette livraison</label>
                      <input id="addrPhone" type="tel" [(ngModel)]="newAddressPhone" name="addrPhone" placeholder="Ex: +225 07 00 00 00 00" class="w-full bg-surface-2 border-transparent rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all">
                    </div>
                  </div>

                  <div class="mt-8 flex justify-end gap-3 border-t border-surface-2 pt-6">
                    <button type="button" (click)="showAddForm.set(false)" class="px-6 py-2.5 rounded-xl border border-surface-2 text-[10px] font-black uppercase tracking-widest text-[#5a5e72] hover:bg-surface-2 transition-all cursor-pointer">
                      Annuler
                    </button>
                    <button type="button" (click)="addAddress()" class="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00925c] transition-all cursor-pointer active:scale-95 shadow-lg shadow-primary/20">
                      Enregistrer l'adresse
                    </button>
                  </div>
                </div>
              }
            </div>
          }

          @if (activeTab() === 'sav') {
            <div class="space-y-6">
              <div class="bg-white border border-surface-2 rounded-3xl p-8">
                <div class="flex items-center justify-between mb-8">
                  <div>
                    <h3 class="text-[10px] font-black uppercase text-muted tracking-widest">Mes Demandes de SAV</h3>
                    <p class="text-[10px] text-muted font-normal mt-1">Suivez l'état de vos réclamations et diagnostics techniques O'CHAP en temps réel.</p>
                  </div>
                  <button routerLink="/sav-garanties" class="bg-dark text-white hover:bg-primary px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-dark/10 transition-all cursor-pointer">
                    <mat-icon class="scale-50">add_circle_outline</mat-icon> Nouvelle demande
                  </button>
                </div>

                <div class="space-y-6">
                  @for (req of mySavRequests(); track req.id) {
                    <div class="p-6 border border-surface-2 rounded-2xl hover:border-primary/20 hover:shadow-xl hover:shadow-black/[0.01] transition-all bg-surface-1">
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-2/60">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-xl bg-white border border-surface-2 flex items-center justify-center text-dark font-mono text-[9px] font-black shadow-sm uppercase font-display">#{{ req.id.slice(-6).toUpperCase() }}</div>
                          <div>
                            <h4 class="text-xs font-black text-dark uppercase">{{ req.productName }}</h4>
                            <p class="text-[9px] font-bold text-muted mt-0.5">Type : <span class="uppercase text-primary">{{ req.type }}</span> • Demandée le {{ formatDate(req.createdAt) }}</p>
                          </div>
                        </div>
                        <div>
                          @if (req.status === 'resolved') {
                            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                              ● RÉSOLU
                            </span>
                          } @else {
                            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-100 animate-pulse">
                              ● EN COURS
                            </span>
                          }
                        </div>
                      </div>

                      <div class="py-4">
                        <p class="text-[11px] text-[#0D1B2A] font-semibold italic leading-relaxed">
                          "{{ req.description }}"
                        </p>
                      </div>

                      @if (req.aiAnalysis) {
                        <div class="mt-2 p-5 bg-white rounded-xl border border-surface-2/60 space-y-4">
                          <div class="flex items-center gap-2">
                            <mat-icon class="text-primary scale-75">psychology</mat-icon>
                            <span class="text-[9px] font-black text-dark uppercase tracking-widest">Analyse Intelligente O'CHAP</span>
                            <span class="ml-auto text-[8px] font-black px-2 py-0.5 rounded-md uppercase"
                                  [class.bg-red-50]="req.aiAnalysis.severity === 'Critique' || req.aiAnalysis.severity === 'Haute'"
                                  [class.text-red-600]="req.aiAnalysis.severity === 'Critique' || req.aiAnalysis.severity === 'Haute'"
                                  [class.bg-orange-50]="req.aiAnalysis.severity === 'Moyenne'"
                                  [class.text-orange-600]="req.aiAnalysis.severity === 'Moyenne'"
                                  [class.bg-emerald-50]="req.aiAnalysis.severity === 'Faible'"
                                  [class.text-emerald-600]="req.aiAnalysis.severity === 'Faible'">
                              Gravité : {{ req.aiAnalysis.severity }}
                            </span>
                          </div>

                          <div class="space-y-3">
                            <div>
                              <p class="text-[9px] font-black uppercase text-muted tracking-wider">Résumé technique :</p>
                              <p class="text-[10px] font-semibold text-dark mt-0.5">{{ req.aiAnalysis.summary }}</p>
                            </div>

                            @if (req.aiAnalysis.probableCauses && req.aiAnalysis.probableCauses.length > 0) {
                              <div>
                                <p class="text-[9px] font-black uppercase text-muted tracking-wider">Causes Probables estimées :</p>
                                <ul class="list-disc pl-4 text-[10px] text-dark/70 font-medium mt-1 space-y-0.5">
                                  @for (cause of req.aiAnalysis.probableCauses; track cause) {
                                    <li>{{ cause }}</li>
                                  }
                                </ul>
                              </div>
                            }

                            @if (req.aiAnalysis.recommendations && req.aiAnalysis.recommendations.length > 0) {
                              <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <p class="text-[9px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                                  <mat-icon class="scale-[0.6]">warning</mat-icon> Recommandations de sécurité & Auto-dépannage :
                                </p>
                                <ul class="list-disc pl-4 text-[10px] text-dark/70 font-medium mt-1.5 space-y-1">
                                  @for (rec of req.aiAnalysis.recommendations; track rec) {
                                    <li>{{ rec }}</li>
                                  }
                                </ul>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  } @empty {
                    <div class="py-16 text-center border-2 border-dashed border-surface-2 rounded-2xl bg-surface-1">
                      <mat-icon class="scale-125 text-muted mb-3">contact_support</mat-icon>
                      <h4 class="text-xs font-black text-[#0d1b2a] uppercase tracking-wide">Aucun ticket de réclamation</h4>
                      <p class="text-[10px] text-muted mt-1 leading-normal">Vous n'avez pas soumis de réclamation de garantie ou d'assistance pour le moment.</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <div class="mt-12 flex justify-end gap-4">
          <button routerLink="/" class="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted hover:bg-surface-2 transition-all">
            Fermer les options
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
export class ProfileComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private dataService = inject(DataService);
  private router = inject(Router);
  activeTab = signal<string>('general');
  private unsubSavRequests?: () => void;

  // Address signals
  addresses = computed<Address[]>(() => {
    const p = this.authService.profile$() as Record<string, unknown>;
    return (p?.['addresses'] as Address[]) || [];
  });

  mySavRequests = computed(() => {
    const user = this.authService.user$();
    if (!user) return [];
    return this.dataService.savRequests$().filter(r => r.customerUid === user.uid);
  });

  showAddForm = signal(false);
  newAddressLabel = '';
  newAddressStreet = '';
  newAddressCity = '';
  newAddressPhone = '';

  ngOnInit() {
    this.unsubSavRequests = this.dataService.watchAllSavRequests();
  }

  ngOnDestroy() {
    if (this.unsubSavRequests) {
      this.unsubSavRequests();
    }
  }

  formatDate(timestamp: unknown): string {
    if (!timestamp) return '...';
    try {
      const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp
        ? (timestamp as { toDate: () => Date }).toDate()
        : new Date(timestamp as string | number | Date);
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    } catch { return '...'; }
  }

  async addAddress() {
    if (!this.newAddressLabel || !this.newAddressStreet || !this.newAddressCity) {
      alert('Veuillez remplir au moins le libellé, la rue/quartier et la ville.');
      return;
    }

    const newAdd = {
      id: 'addr_' + Date.now(),
      label: this.newAddressLabel,
      street: this.newAddressStreet,
      city: this.newAddressCity,
      phone: this.newAddressPhone
    };

    const currentAddresses = this.addresses();
    const updated = [...currentAddresses, newAdd];

    const success = await this.authService.updateProfile({
      addresses: updated as unknown[]
    });

    if (success) {
      this.newAddressLabel = '';
      this.newAddressStreet = '';
      this.newAddressCity = '';
      this.newAddressPhone = '';
      this.showAddForm.set(false);
    } else {
      alert("Une erreur est survenue lors de l'enregistrement de l'adresse.");
    }
  }

  async deleteAddress(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cette adresse ?')) return;
    const currentAddresses = this.addresses();
    const updated = currentAddresses.filter(a => (a as { id: string }).id !== id);
    await this.authService.updateProfile({
      addresses: updated as unknown[]
    });
  }

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
