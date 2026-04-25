import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-financing',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[#fafbfc] pb-32">
      <!-- Premium Hero -->
      <div class="bg-[#0D1B2A] text-white pt-32 pb-48 relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,98,0,0.1),transparent)]"></div>
        <div class="max-w-7xl mx-auto px-6 text-center space-y-10">
          <div class="inline-flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
             <mat-icon class="text-primary scale-75">payments</mat-icon>
             <span class="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Facilités de Paiement</span>
          </div>
          <h1 class="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">Équiper son foyer <br><span class="text-primary italic">sans compromis.</span></h1>
          <p class="text-xl text-white/50 max-w-2xl mx-auto font-medium">O'CHAP vous propose des solutions de financement adaptées à votre budget, en partenariat avec les leaders bancaires de Côte d'Ivoire.</p>
        </div>
      </div>

      <!-- Plans -->
      <div class="max-w-7xl mx-auto px-6 -mt-32">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
           @for (plan of plans; track plan.title) {
             <div class="bg-white p-12 rounded-[4rem] border border-[#e4e6ea] shadow-2xl shadow-gray-200/50 flex flex-col items-center text-center group cursor-default hover:border-primary/30 transition-all">
                <div class="w-20 h-20 rounded-[2.5rem] bg-[#f8f9fa] border border-[#e4e6ea] flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                   <mat-icon class="scale-[1.5]">{{ plan.icon }}</mat-icon>
                </div>
                <h3 class="text-3xl font-black text-[#0D1B2A] tracking-tighter mb-4">{{ plan.title }}</h3>
                <div class="text-4xl font-black text-primary mb-8">{{ plan.rate }}</div>
                <p class="text-[14px] text-[#5a5e72] font-medium leading-relaxed mb-10">{{ plan.desc }}</p>
                
                <div class="w-full space-y-4 mb-12">
                   @for (f of plan.features; track f) {
                     <div class="flex items-center gap-3 text-left">
                        <mat-icon class="text-emerald-500 scale-75">check_circle</mat-icon>
                        <span class="text-[11px] font-black text-[#0D1B2A] uppercase tracking-widest">{{ f }}</span>
                     </div>
                   }
                </div>
                
                <button class="w-full py-5 rounded-2xl bg-[#0D1B2A] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary transition-all">Simulation rapide</button>
             </div>
           }
        </div>
      </div>

      <!-- Partners -->
      <div class="max-w-3xl mx-auto px-6 mt-32 text-center">
         <h4 class="text-[11px] font-black text-[#9699a8] uppercase tracking-[0.5em] mb-12">Partenaires Bancaires Officiels</h4>
         <div class="flex flex-wrap justify-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            @for (p of ['SOCIETE GENERALE', 'NSIA BANQUE', 'ORABANK', 'ADVANS']; track p) {
               <span class="text-lg font-black tracking-tighter text-[#0D1B2A]">{{ p }}</span>
            }
         </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class FinancingComponent {
  plans = [
    { 
      title: 'Pack Sérénité', 
      icon: 'update', 
      rate: '3 FOIS', 
      desc: 'Idéal pour le petit électroménager et les accessoires. Pas de dossier complexe.',
      features: ['0% de frais initiaux', 'Réponse immédiate', 'Via Mobile Money']
    },
    { 
      title: 'Pack Confort', 
      icon: 'kitchen', 
      rate: '6 FOIS', 
      desc: 'Pour équiper votre cuisine ou salon. Financement intermédiaire avec partenaire.',
      features: ['Taux préférentiel', 'Paiement échelonné', 'Début après 30j']
    },
    { 
      title: 'Pack Famille', 
      icon: 'house', 
      rate: '12 FOIS', 
      desc: 'La solution complète pour tout équiper d\'un coup. Financement bancaire longue durée.',
      features: ['Assurance incluse', 'Report de mensualité', 'Assistance premium']
    }
  ];
}
