import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sav-garanties',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#fafbfc] pb-20">
      <!-- Header Section -->
      <div class="bg-primary text-white py-24 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-[100px]"></div>
        <div class="max-w-7xl mx-auto px-6 relative z-10">
          <h1 class="text-5xl font-black tracking-tighter mb-6">SAV & Garanties.</h1>
          <p class="text-xl text-white/80 max-w-2xl font-medium leading-relaxed italic">
            Votre tranquillité d'esprit est notre priorité absolue. O'CHAP assure un service après-vente de proximité.
          </p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-12">
          <section class="bg-white p-10 rounded-[3rem] border border-[#e4e6ea] shadow-sm">
            <h2 class="text-2xl font-black text-[#0D1B2A] mb-8 flex items-center gap-4">
               <div class="w-10 h-10 rounded-xl bg-orange-50 text-primary flex items-center justify-center"><mat-icon>security</mat-icon></div>
               Garantie Constructeur
            </h2>
            <div class="prose prose-slate max-w-none space-y-6 text-[#5a5e72] font-medium leading-relaxed">
              <p>Tous les articles vendus sur O'CHAP bénéficient d'une garantie contractuelle minimale de 12 mois. Pour certains produits (gros électroménager), cette garantie peut être étendue à 24 ou 36 mois.</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                 <div class="p-6 rounded-2xl bg-[#fafbfc] border border-[#e4e6ea]">
                    <div class="text-xs font-black text-[#0D1B2A] uppercase mb-2">Couverture</div>
                    <p class="text-[11px]">Pièces, main d'œuvre et déplacement (selon conditions).</p>
                 </div>
                 <div class="p-6 rounded-2xl bg-[#fafbfc] border border-[#e4e6ea]">
                    <div class="text-xs font-black text-[#0D1B2A] uppercase mb-2">Exclusions</div>
                    <p class="text-[11px]">Casses accidentelles, surtensions électriques non protégées, usage non conforme.</p>
                 </div>
              </div>
            </div>
          </section>

          <section class="bg-white p-10 rounded-[3rem] border border-[#e4e6ea] shadow-sm">
            <h2 class="text-2xl font-black text-[#0D1B2A] mb-8 flex items-center gap-4">
               <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><mat-icon>build</mat-icon></div>
               Activation Technique
            </h2>
            <div class="space-y-6">
              @for (step of steps; track step.num) {
                <div class="flex gap-6 items-start group">
                  <div class="w-12 h-12 rounded-full border-2 border-[#e4e6ea] text-xl font-black text-[#9699a8] flex items-center justify-center flex-shrink-0 group-hover:border-primary group-hover:text-primary transition-colors">
                    {{ step.num }}
                  </div>
                  <div class="pt-2">
                    <h4 class="text-lg font-black text-[#0D1B2A]">{{ step.title }}</h4>
                    <p class="text-sm text-[#5a5e72] mt-1 font-medium leading-normal">{{ step.desc }}</p>
                  </div>
                </div>
              }
            </div>
          </section>
        </div>

        <!-- Sidebar Contact -->
        <div class="space-y-8">
           <div class="bg-[#0D1B2A] p-10 rounded-[3rem] text-white space-y-8">
              <h3 class="text-xl font-black tracking-tight">Support Technique</h3>
              <div class="space-y-6">
                 <div class="flex items-start gap-4">
                    <mat-icon class="text-primary mt-1">phone_in_talk</mat-icon>
                    <div>
                       <div class="text-[10px] font-black text-white/40 uppercase tracking-widest">Appel Direct</div>
                       <div class="text-lg font-black">+225 07 00 00 00 00</div>
                    </div>
                 </div>
                 <div class="flex items-start gap-4">
                    <mat-icon class="text-emerald-400 mt-1">chat</mat-icon>
                    <div>
                       <div class="text-[10px] font-black text-white/40 uppercase tracking-widest">WhatsApp Business</div>
                       <div class="text-lg font-black">+225 27 00 00 00 00</div>
                    </div>
                 </div>
              </div>
              <button class="w-full py-4 bg-primary rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 transition-all">Déclarer un incident</button>
           </div>

           <div class="bg-white p-10 rounded-[3rem] border border-[#e4e6ea] border-dashed">
              <h3 class="text-lg font-black text-[#0D1B2A] mb-4">Centres Agrées</h3>
              <p class="text-xs text-[#5a5e72] font-medium mb-6">Nous disposons de centres de réparation partenaires à Abidjan, Bouaké, San-Pedro et Yamoussoukro.</p>
              <div class="space-y-4">
                 @for (city of ['Abidjan Sud', 'Abidjan Nord', 'Bouaké']; track city) {
                   <div class="flex items-center justify-between py-3 border-b border-[#f5f6f8]">
                      <span class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-wider">{{ city }}</span>
                      <mat-icon class="text-[#ced4da] scale-75">location_on</mat-icon>
                   </div>
                 }
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class SavGarantiesComponent {
  steps = [
    { num: '01', title: 'Déclaration', desc: 'Contactez notre support avec votre numéro de facture.' },
    { num: '02', title: 'Diagnostic', desc: 'Un technicien effectue un premier diagnostic à distance ou sur site.' },
    { num: '03', title: 'Prise en charge', desc: 'Réparation à domicile ou enlèvement pour atelier central.' },
    { num: '04', title: 'Restitution', desc: 'Remplacement de l\'appareil si non réparable sous 15 jours.' }
  ];
}
