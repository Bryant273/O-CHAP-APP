import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-shipping-info',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#fafbfc] pb-20">
      <!-- Top banner -->
      <div class="bg-indigo-600 text-white pt-24 pb-32">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div class="space-y-4">
              <h1 class="text-6xl font-black tracking-tighter">Livraison.</h1>
              <p class="text-xl text-white/70 max-w-xl font-medium">Nous livrons partout en Côte d'Ivoire avec le plus grand soin, directement à votre porte.</p>
            </div>
            <div class="flex gap-4">
               <div class="p-6 bg-white/10 rounded-3xl border border-white/5 backdrop-blur-md">
                  <div class="text-3xl font-black">24H</div>
                  <div class="text-[9px] font-black uppercase tracking-widest text-white/50">Abidjan</div>
               </div>
               <div class="p-6 bg-white/10 rounded-3xl border border-white/5 backdrop-blur-md">
                  <div class="text-3xl font-black">72H</div>
                  <div class="text-[9px] font-black uppercase tracking-widest text-white/50">Villes Intérieures</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail cards -->
      <div class="max-w-7xl mx-auto px-6 -mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div class="lg:col-span-2 space-y-8">
            @for (zone of zones; track zone.title) {
               <div class="bg-white p-10 rounded-[3rem] border border-[#e4e6ea] shadow-sm flex flex-col md:flex-row gap-10 items-start">
                  <div class="w-20 h-20 rounded-[2.5rem] bg-[#f8f9fa] border border-[#e4e6ea] flex items-center justify-center flex-shrink-0">
                     <mat-icon class="scale-[1.5] text-indigo-600">{{ zone.icon }}</mat-icon>
                  </div>
                  <div>
                     <h3 class="text-2xl font-black text-[#0D1B2A] tracking-tight mb-4">{{ zone.title }}</h3>
                     <p class="text-[14px] text-[#5a5e72] leading-relaxed font-medium mb-6">{{ zone.desc }}</p>
                     <div class="flex flex-wrap gap-3">
                        @for (p of zone.perks; track p) {
                           <span class="px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest">{{ p }}</span>
                        }
                     </div>
                  </div>
               </div>
            }
         </div>

         <!-- Shipping FAQ/Summary -->
         <div class="bg-[#0D1B2A] p-10 rounded-[3rem] text-white space-y-10 shadow-2xl shadow-navy/20">
            <h3 class="text-xl font-black tracking-tight border-b border-white/10 pb-6 italic">Bon à savoir</h3>
            <div class="space-y-8">
               <div class="space-y-3">
                  <div class="text-xs font-black text-primary uppercase tracking-[0.2em]">Zones de gratuité</div>
                  <p class="text-[11px] text-white/50 leading-relaxed font-medium">La livraison est offerte à partir de 500 000 FCFA d'achat dans tout le district d'Abidjan.</p>
               </div>
               <div class="space-y-3">
                  <div class="text-xs font-black text-primary uppercase tracking-[0.2em]">Horaires</div>
                  <p class="text-[11px] text-white/50 leading-relaxed font-medium">Nos livreurs circulent du Lundi au Samedi de 08h00 à 19h00.</p>
               </div>
               <div class="space-y-3">
                  <div class="text-xs font-black text-primary uppercase tracking-[0.2em]">Installation</div>
                  <p class="text-[11px] text-white/50 leading-relaxed font-medium">Pour le gros électroménager, l'installation standard est incluse lors du déballage.</p>
               </div>
            </div>
            
            <div class="pt-6">
               <button class="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all">Suivre mon colis</button>
            </div>
         </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ShippingInfoComponent {
  zones = [
    { 
      title: 'District d\'Abidjan', 
      icon: 'location_city', 
      desc: 'Couverture complète des 10 communes de la capitale économique. Livraison à domicile ou au bureau.',
      perks: ['24h Chrono', 'Option soir', 'Paiement à réception']
    },
    { 
      title: 'Villes de l\'Intérieur', 
      icon: 'map', 
      desc: 'Nous livrons dans les principales villes (Yamoussoukro, Bouaké, San-Pedro, Korhogo) via notre propre flotte ou partenaires certifiés.',
      perks: ['48h - 72h', 'Points relais', 'Colis assuré']
    }
  ];
}
