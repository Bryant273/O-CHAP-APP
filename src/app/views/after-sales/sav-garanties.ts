import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { DataService, OchapOrder, OchapOrderItem } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { SavFaqComponent } from './sav-faq';

@Component({
  selector: 'app-sav-garanties',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule, SavFaqComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface font-sans pb-20">
      <!-- Header -->
      <header class="header sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-surface-2 px-6 py-4 flex items-center justify-between shadow-sm shadow-black/[0.02]">
        <button routerLink="/" class="flex items-center gap-2 text-muted hover:text-dark transition-all text-[10px] font-black uppercase tracking-widest group">
          <mat-icon class="scale-75 group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
          Retour Boutique
        </button>
        <div class="font-display font-black text-2xl text-dark tracking-tighter uppercase italic">O'<span class="text-primary">CHAP</span></div>
        <div class="w-10"></div> <!-- Spacer -->
      </header>

      <main class="max-w-5xl mx-auto px-6 py-12">
        <div class="mb-12 animate-fade-up">
           <div class="flex items-center gap-3 mb-4">
              <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span class="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Centre de Garantie & SAV Certifié</span>
           </div>
           <h1 class="text-5xl font-black text-dark tracking-tighter mb-4 leading-tight">Garantie <span class="text-primary italic">Sérénité.</span></h1>
           <p class="text-muted text-lg max-w-2xl font-medium leading-relaxed opacity-70">
             Chaque produit O'CHAP bénéficie d'une garantie constructeur de 24 mois minimum. 
             Gérez vos retours et réclamations en toute fluidité depuis cet espace.
           </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           <!-- Left Column: FAQ/Rules -->
           <div class="lg:col-span-1 space-y-8">
              <div class="bg-dark rounded-[2.5rem] p-8 text-white-soft shadow-2xl shadow-dark/20 relative overflow-hidden group">
                 <mat-icon class="absolute -right-6 -bottom-6 text-white/5 scale-[5] rotate-12 group-hover:rotate-0 transition-transform duration-700">verified_user</mat-icon>
                 <div class="relative z-10">
                    <h3 class="text-xl font-display font-bold mb-6 italic">Nos Standards Qualité</h3>
                    <div class="space-y-6">
                       <div class="flex gap-4">
                          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                             <mat-icon class="scale-75">history</mat-icon>
                          </div>
                          <div>
                             <p class="text-xs font-bold text-white mb-1">14 Jours d'Essai</p>
                             <p class="text-[10px] opacity-60 leading-relaxed font-medium">Retour sans frais si l'article est dans son emballage d'origine scellé.</p>
                          </div>
                       </div>
                       <div class="flex gap-4">
                          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                             <mat-icon class="scale-75">handyman</mat-icon>
                          </div>
                          <div>
                             <p class="text-xs font-bold text-white mb-1">Assistance Technique</p>
                             <p class="text-[10px] opacity-60 leading-relaxed font-medium">Intervention sous 72h à Abidjan pour le gros électroménager.</p>
                          </div>
                       </div>
                       <div class="flex gap-4">
                          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                             <mat-icon class="scale-75">shield</mat-icon>
                          </div>
                          <div>
                             <p class="text-xs font-bold text-white mb-1">Garantie Afrique</p>
                             <p class="text-[10px] opacity-60 leading-relaxed font-medium">Réseau de techniciens agréés à Abidjan et dans toute la Côte d'Ivoire.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

               <app-sav-faq></app-sav-faq>

               <div class="bg-white rounded-[2rem] border border-surface-2 p-8 shadow-sm">
                  <h4 class="text-[10px] font-black uppercase text-muted tracking-widest mb-4">Besoin d'aide immédiate?</h4>
                 <p class="text-xs font-medium text-dark/70 mb-6 leading-relaxed">Nos conseillers SAV sont disponibles par téléphone 7j/7 pour vous guider dans votre diagnostic.</p>
                 <a href="tel:+22501020304" class="inline-flex items-center gap-3 text-primary text-xs font-black uppercase tracking-widest hover:opacity-70 transition-opacity">
                    <mat-icon class="scale-75">call</mat-icon>
                    01 02 03 04 05
                 </a>
              </div>
           </div>

           <!-- Right Column: Returns Manager -->
           <div class="lg:col-span-2">
              <div class="bg-white rounded-[3rem] border border-surface-2 shadow-2xl shadow-black/[0.03] overflow-hidden">
                 <div class="p-8 md:p-12">
                    <div class="flex items-center justify-between mb-10">
                       <h3 class="text-2xl font-display font-black text-dark tracking-tight italic">Mes Articles <span class="text-primary">Garantis.</span></h3>
                       <div class="px-4 py-1.5 bg-surface-2 rounded-full text-[9px] font-black uppercase tracking-widest text-muted">
                          {{ eligibleOrders().length }} Commandes Éligibles
                       </div>
                    </div>

                    @if (eligibleOrders().length > 0) {
                       <div class="space-y-6">
                          @for (order of eligibleOrders(); track order.id) {
                             <div class="bg-surface/50 rounded-[2rem] border border-white p-6 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-black/[0.02] group">
                                <div class="flex items-center justify-between mb-4 pb-4 border-b border-white/60">
                                   <div class="flex items-center gap-4">
                                      <div class="w-10 h-10 rounded-xl bg-white border border-surface-2 flex items-center justify-center text-dark font-mono text-[9px] font-black shadow-sm uppercase">#{{ order.id ? order.id.slice(-6) : '...' }}</div>
                                      <div>
                                         <p class="text-[10px] font-black text-muted uppercase tracking-widest">Commandé le {{ formatDate(order.createdAt) }}</p>
                                         <p class="text-xs font-bold text-dark mt-0.5">Statut : {{ order.status }}</p>
                                      </div>
                                   </div>
                                   <div class="text-right">
                                      <p class="text-[9px] font-black uppercase tracking-widest text-emerald-600">Garantie Activer</p>
                                      <p class="text-[10px] font-bold text-muted mt-1">Exp: 2028</p>
                                   </div>
                                </div>

                                <div class="space-y-3">
                                   @for (item of order.items; track item.id) {
                                      <div class="flex items-center justify-between p-3 bg-white rounded-2xl border border-surface-2 group/item">
                                         <div class="flex items-center gap-4">
                                            <div class="w-14 h-14 rounded-xl overflow-hidden bg-surface-2 border border-surface-2/40 shrink-0">
                                               <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-cover">
                                            </div>
                                            <div class="min-w-0">
                                               <h4 class="text-[11px] font-black text-dark uppercase truncate max-w-[200px]">{{ item.name }}</h4>
                                               <p class="text-[10px] font-bold text-muted mt-0.5">{{ item.category }}</p>
                                            </div>
                                         </div>
                                         
                                         <button (click)="initRepairRequest(order, item)"
                                                 class="flex items-center gap-2 px-6 h-10 rounded-xl bg-dark text-white text-[9px] font-black uppercase tracking-widest hover:bg-primary shadow-xl shadow-dark/10 transition-all active:scale-95">
                                            <mat-icon class="scale-75">handyman</mat-icon>
                                            Réclamation
                                         </button>
                                      </div>
                                   }
                                </div>
                             </div>
                          }
                       </div>
                    } @else {
                       <div class="py-20 flex flex-col items-center justify-center text-center opacity-30">
                          <mat-icon class="scale-[3] mb-6">assignment_return</mat-icon>
                          <h4 class="text-xl font-display font-bold uppercase tracking-widest">Aucun historique de retour</h4>
                          <p class="text-xs font-bold max-w-sm mt-2">Vous n'avez pas encore passé de commande ou vos garanties ont expiré.</p>
                       </div>
                    }
                 </div>
              </div>
           </div>
        </div>
      </main>

       <!-- Return Request Modal -->
       @if (activeRequest(); as req) {
          <div class="fixed inset-0 z-[1000] flex items-center justify-center p-6">
             <div class="absolute inset-0 bg-dark/60 backdrop-blur-sm" (click)="closeModal()" (keydown.escape)="closeModal()" role="button" tabindex="0" aria-label="Fermer le dialogue"></div>
             <div class="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border border-surface-2 overflow-hidden animate-fade-up-short">
                <div class="p-10 border-b border-surface-2 bg-surface-3">
                   <h3 class="text-2xl font-display font-black text-dark tracking-tight mb-2">Formulaire de <span class="text-primary italic">Réclamation.</span></h3>
                   <p class="text-[10px] font-black text-muted uppercase tracking-widest">Analyse prédictive intelligente O'CHAP par Gemini</p>
                </div>
                
                @if (isAnalyzing()) {
                   <!-- Analyzing State Display -->
                   <div class="p-12 flex flex-col items-center justify-center text-center space-y-6">
                      <div class="relative w-20 h-20">
                         <div class="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
                         <div class="absolute inset-x-0 top-0 h-20 w-20 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                         <div class="absolute inset-0 flex items-center justify-center text-primary">
                            <mat-icon class="scale-125 animate-bounce">psychology</mat-icon>
                         </div>
                      </div>
                      <div>
                         <h4 class="text-sm font-black text-dark uppercase tracking-wide">Analyse intelligente en cours...</h4>
                         <p class="text-[11px] text-muted font-medium max-w-xs mx-auto mt-2 leading-relaxed">
                            Gemini diagnostique votre description SAV et formule des recommandations de dépannage personnalisées.
                         </p>
                      </div>
                   </div>
                } @else if (analysisResult(); as analysis) {
                   <!-- AI Result Display -->
                   <div class="p-10 space-y-6 max-h-[400px] overflow-y-auto no-scrollbar">
                      <div class="p-5 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
                         <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                               <mat-icon class="scale-75">psychology</mat-icon>
                            </div>
                            <div>
                               <h4 class="text-xs font-black text-dark uppercase tracking-widest">Diagnostic Assistant IA</h4>
                               <p class="text-[9px] text-muted font-bold mt-0.5">Analyse préliminaire instantanée</p>
                            </div>
                            <span class="ml-auto text-[8px] font-black px-3 py-1 rounded-full uppercase border"
                                  [class.bg-red-50]="analysis.severity === 'Critique' || analysis.severity === 'Haute'"
                                  [class.text-red-600]="analysis.severity === 'Critique' || analysis.severity === 'Haute'"
                                  [class.border-red-100]="analysis.severity === 'Critique' || analysis.severity === 'Haute'"
                                  [class.bg-orange-50]="analysis.severity === 'Moyenne'"
                                  [class.text-orange-600]="analysis.severity === 'Moyenne'"
                                  [class.border-orange-100]="analysis.severity === 'Moyenne'"
                                  [class.bg-emerald-50]="analysis.severity === 'Faible'"
                                  [class.text-emerald-600]="analysis.severity === 'Faible'"
                                  [class.border-emerald-100]="analysis.severity === 'Faible'">
                               {{ analysis.severity }}
                            </span>
                         </div>

                         <div class="pt-2 space-y-3.5 border-t border-primary/10">
                            <div>
                               <p class="text-[9px] font-black uppercase text-muted tracking-wide">Nature estimée de la panne :</p>
                               <p class="text-[11px] font-bold text-dark mt-1 italic leading-relaxed">"{{ analysis.summary }}"</p>
                            </div>

                            @if (analysis.probableCauses && analysis.probableCauses.length > 0) {
                               <div>
                                  <p class="text-[9px] font-black uppercase text-muted tracking-wide">Causes probables :</p>
                                  <ul class="list-disc pl-4 text-[10px] text-dark/80 font-semibold mt-1 space-y-1">
                                     @for (cause of analysis.probableCauses; track cause) {
                                        <li>{{ cause }}</li>
                                     }
                                  </ul>
                               </div>
                            }

                            @if (analysis.recommendations && analysis.recommendations.length > 0) {
                               <div class="p-4 bg-white rounded-2xl border border-primary/10">
                                  <p class="text-[9px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                                     <mat-icon class="scale-50">gavel</mat-icon> Conseils de Sécurité & d'Auto-Dépannage :
                                  </p>
                                  <ul class="list-disc pl-4 text-[10px] text-dark/70 font-semibold mt-1.5 space-y-1">
                                     @for (rec of analysis.recommendations; track rec) {
                                        <li>{{ rec }}</li>
                                     }
                                  </ul>
                               </div>
                            }
                         </div>
                      </div>

                      <p class="text-[10px] text-muted text-center font-bold px-2">
                         Souhaitez-vous tout de même soumettre officiellement le ticket à nos techniciens de support SAV ?
                      </p>
                   </div>

                   <div class="p-10 border-t border-surface-2 bg-surface-3 flex gap-4">
                      <button (click)="analysisResult.set(null)" class="flex-1 h-14 border-2 border-surface-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Retour</button>
                      <button (click)="finalizeSubmit()"
                              class="flex-[2] h-14 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-navy transition-all active:scale-95">
                         Confirmer & Soumettre
                      </button>
                   </div>
                } @else {
                   <!-- Standard Input Form -->
                   <div class="p-10 space-y-8">
                      <div class="flex items-center gap-6 p-4 bg-surface rounded-3xl border border-surface-2">
                         <div class="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0">
                            <img [src]="req.item.imageUrl" alt="" class="w-full h-full object-cover">
                         </div>
                         <div>
                            <h4 class="text-xs font-black text-dark uppercase">{{ req.item.name }}</h4>
                            <p class="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Commande #{{ req.orderId.slice(-8) }}</p>
                         </div>
                      </div>

                      <div class="space-y-4">
                         <div class="space-y-2">
                            <label for="requestTypeSelect" class="text-[10px] font-black text-dark uppercase ml-1">Type de requête</label>
                            <select id="requestTypeSelect" [(ngModel)]="requestType" class="w-full h-14 bg-surface border border-surface-2 rounded-2xl px-6 text-xs font-bold outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                               <option value="repair">Réparation sous garantie</option>
                               <option value="return">Retour & Remboursement (14 jours)</option>
                               <option value="technical">Diagnostic technique</option>
                               <option value="missing">Éléments manquants</option>
                            </select>
                         </div>

                         <div class="space-y-2">
                            <label for="requestDescText" class="text-[10px] font-black text-dark uppercase ml-1">Description détaillée du problème</label>
                            <textarea id="requestDescText" [(ngModel)]="requestDesc" placeholder="Soyez le plus précis possible pour accélérer le traitement..." 
                                      class="w-full h-40 bg-surface border border-surface-2 rounded-3xl p-6 text-xs font-bold outline-none focus:border-primary transition-all resize-none"></textarea>
                         </div>
                      </div>
                   </div>

                   <div class="p-10 border-t border-surface-2 bg-surface-3 flex gap-4">
                      <button (click)="closeModal()" class="flex-1 h-14 border-2 border-surface-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Annuler</button>
                      <button (click)="startAnalysis()" [disabled]="!requestDesc"
                              class="flex-[2] h-14 bg-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                         <mat-icon class="scale-75">psychology</mat-icon>
                         Analyser et Poursuivre
                      </button>
                   </div>
                }
             </div>
          </div>
       }

      <!-- SUCCESS TOAST -->
      @if (showSuccessToast()) {
         <div class="fixed bottom-10 right-10 z-[2000] bg-emerald-600 border border-emerald-500/10 text-white rounded-3xl p-6 shadow-2xl flex items-center gap-4 max-w-sm animate-fade-in font-sans">
            <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
               <mat-icon class="scale-90">check_circle</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
               <h4 class="text-xs font-black uppercase tracking-wider leading-none">Demande Enregistrée</h4>
               <p class="text-[10px] opacity-80 mt-1 font-medium font-sans">Votre réclamation SAV a été reçue. Un technicien va l'analyser sous 24h.</p>
            </div>
            <button (click)="showSuccessToast.set(false)" class="text-white/65 hover:text-white shrink-0 ml-2">
               <mat-icon class="scale-75">close</mat-icon>
            </button>
         </div>
      }

      <!-- ERROR TOAST -->
      @if (showErrorToast()) {
         <div class="fixed bottom-10 right-10 z-[2000] bg-red-600 text-white rounded-3xl p-6 shadow-2xl flex items-center gap-4 max-w-sm animate-fade-in font-sans">
            <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
               <mat-icon class="scale-90">error_outline</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
               <h4 class="text-xs font-black uppercase tracking-wider leading-none">Échec Soumission</h4>
               <p class="text-[10px] opacity-80 mt-1 font-medium font-sans">Une erreur inattendue est survenue. Veuillez réessayer.</p>
            </div>
            <button (click)="showErrorToast.set(false)" class="text-white/65 hover:text-white shrink-0 ml-2">
               <mat-icon class="scale-75">close</mat-icon>
            </button>
         </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-up-short {
      animation: fadeUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SavGarantiesComponent implements OnInit {
  private authService = inject(AuthService);
  private dataService = inject(DataService);
  private router = inject(Router);

  eligibleOrders = computed(() => {
    return (this.dataService.orders$() as OchapOrder[]).filter(o => o.status !== 'cancelled');
  });

   activeRequest = signal<{ orderId: string; item: OchapOrderItem } | null>(null);
  requestType = 'repair';
  requestDesc = '';
  showSuccessToast = signal(false);
  showErrorToast = signal(false);

  // Gemini AI Analysis signals
  isAnalyzing = signal(false);
  analysisResult = signal<{
    severity: string;
    summary: string;
    probableCauses: string[];
    recommendations: string[];
  } | null>(null);

  constructor() {
    effect(() => {
       const user = this.authService.user$();
       if (user) {
          this.dataService.watchUserOrders(user.uid);
       }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
     if (!this.authService.isAuthenticated()) {
        this.router.navigate(['/auth/login']);
     }
  }

  formatDate(timestamp: unknown): string {
    if (!timestamp) return '...';
    try {
      const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp
        ? (timestamp as { toDate: () => Date }).toDate()
        : new Date(timestamp as string | number | Date);
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    } catch { return '...'; }
  }

  initRepairRequest(order: OchapOrder, item: OchapOrderItem) {
    this.activeRequest.set({ orderId: order.id, item });
    this.requestDesc = '';
    this.analysisResult.set(null);
    this.isAnalyzing.set(false);
  }

  async startAnalysis() {
    if (!this.requestDesc) return;
    this.isAnalyzing.set(true);
    this.analysisResult.set(null);
    try {
      const req = this.activeRequest();
      const res = await fetch('/api/ai/analyze-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: this.requestDesc,
          requestType: this.requestType,
          productName: req?.item.name
        })
      });
      if (res.ok) {
        const data = await res.json();
        this.analysisResult.set(data);
      } else {
        throw new Error('Analysis request failed');
      }
    } catch (e) {
      console.error('Gemini API Technical Analysis Error:', e);
      this.analysisResult.set({
        severity: 'Moyenne',
        summary: 'Problème technique Standard détecté.',
        probableCauses: ['Dysfonctionnement matériel standard', 'Défaut de liaison interne'],
        recommendations: [
          'Veuillez débrancher puis rebrancher l\'appareil.',
          'Conservez l\'appareil dans un endroit sec avant l\'intervention.'
        ]
      });
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async finalizeSubmit() {
    const req = this.activeRequest();
    if (!req) return;

    const success = await this.dataService.createSavRequest({
      orderId: req.orderId,
      productId: req.item.id,
      productName: req.item.name,
      type: this.requestType,
      description: this.requestDesc,
      status: 'pending',
      customerUid: this.authService.user$()?.uid,
      aiAnalysis: this.analysisResult()
    });

    if (success) {
      this.showSuccessToast.set(true);
      setTimeout(() => this.showSuccessToast.set(false), 6000);
      this.closeModal();
    } else {
      this.showErrorToast.set(true);
      setTimeout(() => this.showErrorToast.set(false), 5000);
    }
  }

  closeModal() {
    this.activeRequest.set(null);
    this.isAnalyzing.set(false);
    this.analysisResult.set(null);
    this.requestDesc = '';
  }
}
