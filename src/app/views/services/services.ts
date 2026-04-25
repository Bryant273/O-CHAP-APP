import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#fafbfc] pb-20">
      <!-- Hero -->
      <div class="bg-[#0D1B2A] text-white py-24 relative overflow-hidden">
        <div class="absolute inset-0 bg-primary/5 blur-[120px]"></div>
        <div class="max-w-7xl mx-auto px-6 relative z-10">
          <div class="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full border border-white/5 mb-8">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-widest text-[#9699a8]">Nos Engagements</span>
          </div>
          <h1 class="text-5xl md:text-7xl font-black tracking-tighter mb-6">Services O'CHAP.</h1>
          <p class="text-xl text-white/60 max-w-2xl font-medium leading-relaxed">
            Plus qu'un simple achat, nous vous accompagnons à chaque étape pour une expérience sereine et durable.
          </p>
        </div>
      </div>

      <!-- Services Grid -->
      <div class="max-w-7xl mx-auto px-6 -mt-12 group">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          @for (s of services; track s.title) {
            <div class="bg-white p-10 rounded-[3rem] border border-[#e4e6ea] shadow-xl shadow-gray-200/20 hover:shadow-2xl hover:shadow-primary/5 transition-all group/card">
              <div class="w-16 h-16 rounded-[2rem] bg-[#f8f9fa] flex items-center justify-center mb-8 border border-[#e4e6ea] group-hover/card:bg-primary group-hover/card:text-white transition-all duration-500">
                <mat-icon class="scale-125">{{ s.icon }}</mat-icon>
              </div>
              <h3 class="text-2xl font-black text-[#0D1B2A] tracking-tight mb-4">{{ s.title }}</h3>
              <p class="text-[13px] text-[#5a5e72] leading-relaxed font-medium">{{ s.desc }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Specialized Support Section -->
      <div class="max-w-7xl mx-auto px-6 mt-24">
        <div class="bg-white rounded-[4rem] border border-[#e4e6ea] p-12 md:p-20 flex flex-col md:flex-row items-center gap-16 shadow-2xl shadow-gray-200/40">
          <div class="flex-1 space-y-8">
             <h2 class="text-4xl font-black text-[#0D1B2A] tracking-tighter">Installation & <br><span class="text-primary">Mise en route.</span></h2>
             <p class="text-base text-[#5a5e72] leading-relaxed font-medium">
               Nos techniciens experts assurent l'installation de vos équipements complexes : climatiseurs split, réfrigérateurs américains, et gros électroménager. Profitez d'une mise en service clé en main immédiate.
             </p>
             <div class="flex flex-wrap gap-4 pt-4">
                <div class="flex items-center gap-3 px-6 py-3 bg-[#f8f9fa] rounded-2xl border border-[#e4e6ea]">
                   <mat-icon class="text-primary scale-75">verified</mat-icon>
                   <span class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-wider">Techniciens agréés</span>
                </div>
                <div class="flex items-center gap-3 px-6 py-3 bg-[#f8f9fa] rounded-2xl border border-[#e4e6ea]">
                   <mat-icon class="text-primary scale-75">schedule</mat-icon>
                   <span class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-wider">Rendez-vous 24h/48h</span>
                </div>
             </div>
          </div>
          <div class="flex-1 w-full aspect-[4/3] bg-[#fafbfc] rounded-[3rem] border border-dashed border-[#d1d5db] flex items-center justify-center group relative overflow-hidden">
             <mat-icon class="text-[#e4e6ea] scale-[4]">engineering</mat-icon>
             <div class="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ServicesComponent {
  services = [
    { title: 'Livraison Express', icon: 'local_shipping', desc: 'Livraison à domicile sous 24h à Abidjan et 72h à l\'intérieur du pays. Suivi en temps réel de votre colis.' },
    { title: 'Installation Pro', icon: 'settings_suggest', desc: 'Mise en place de vos appareils par des experts certifiés pour garantir une performance optimale dès le premier jour.' },
    { title: 'Assistance 24/7', icon: 'headset_mic', desc: 'Un service client dédié disponible par WhatsApp et téléphone pour répondre à toutes vos questions techniques.' },
    { title: 'Garantie Totale', icon: 'verified_user', desc: 'Tous nos produits bénéficient d\'une garantie constructeur de 12 à 24 mois. Nous gérons tout le processus SAV.' },
    { title: 'Reprise Ancien', icon: 'recycling', desc: 'Nous reprenons votre ancien appareil lors de la livraison du nouveau pour un recyclage responsable.' },
    { title: 'Paiement Flexible', icon: 'payments', desc: 'Payez en plusieurs fois (jusqu\'à 12 mois) grâce à nos partenaires financiers pour équiper votre foyer sans stress.' }
  ];
}
