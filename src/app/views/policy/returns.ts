import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-returns-policy',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#fafbfc] pb-20">
      <div class="max-w-4xl mx-auto px-6 pt-24">
        <div class="text-center mb-20 space-y-4">
           <h1 class="text-5xl font-black text-[#0D1B2A] tracking-tighter">Politique de Retour.</h1>
           <p class="text-sm font-black text-[#5a5e72] uppercase tracking-[0.3em]">Satisfait ou Remboursé</p>
        </div>

        <div class="space-y-12 bg-white p-12 md:p-20 rounded-[4rem] border border-[#e4e6ea] shadow-xl shadow-gray-200/40">
           <section class="space-y-6">
              <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">1. Délai de rétractation</h2>
              <p class="text-[15px] text-[#5a5e72] leading-relaxed font-medium">
                 Vous disposez de <strong>7 jours calendaires</strong> à compter de la date de réception de votre colis pour changer d'avis. Le retour est simple et encadré par nos conditions de vente.
              </p>
           </section>

           <section class="space-y-6">
              <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">2. Conditions de retour</h2>
              <p class="text-[15px] text-[#5a5e72] leading-relaxed font-medium">
                 Pour que votre retour soit accepté, l'article doit impérativement :
              </p>
              <ul class="space-y-4">
                 @for (item of conditions; track item) {
                   <li class="flex items-start gap-4 bg-[#fafbfc] p-6 rounded-2xl border border-[#e4e6ea]">
                      <mat-icon class="text-primary mt-0.5">check_circle</mat-icon>
                      <span class="text-[14px] font-bold text-[#0D1B2A] leading-tight">{{ item }}</span>
                   </li>
                 }
              </ul>
           </section>

           <section class="space-y-6">
              <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">3. Modalités de remboursement</h2>
              <p class="text-[15px] text-[#5a5e72] leading-relaxed font-medium">
                 Une fois l'article réceptionné et validé par notre service qualité, le remboursement est effectué sous <strong>48h à 72h</strong> via le même mode de paiement utilisé lors de l'achat (Mobile Money, Virement ou Cash).
              </p>
           </section>

           <div class="pt-8 border-t border-[#f5f6f8] flex flex-col sm:flex-row items-center justify-between gap-8">
              <div class="flex items-center gap-4">
                 <div class="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center">
                    <mat-icon>help_center</mat-icon>
                 </div>
                 <div>
                    <div class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-wider">Un doute ?</div>
                    <div class="text-xs font-bold text-[#5a5e72]">Appelez le +225 01 02 03 04 05</div>
                 </div>
              </div>
              <button class="px-10 py-5 bg-[#0D1B2A] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all">Lancer une procédure</button>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ReturnsPolicyComponent {
  conditions = [
    'Être dans son emballage d\'origine non scellé ou endommagé',
    'Être complet avec tous ses accessoires, notices et cadeaux éventuels',
    'Ne pas présenter d\'indices d\'utilisation intense ou de dommages physiques',
    'Être accompagné de la facture originale d\'achat'
  ];
}
