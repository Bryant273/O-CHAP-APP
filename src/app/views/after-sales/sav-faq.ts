import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sav-faq',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-[2rem] border border-surface-2 p-8 shadow-sm space-y-6 mb-8 animate-fade-up">
       <div>
          <h3 class="text-lg font-black text-dark tracking-tight">Questions Fréquentes</h3>
          <p class="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">Tout savoir sur vos garanties O'CHAP</p>
       </div>

       <div class="space-y-3">
          @for (item of faqs(); track item.question; let i = $index) {
             <div class="border-b border-surface-2 last:border-b-0 pb-3 last:pb-0">
                <button (click)="toggleFaq(i)" class="w-full flex items-center justify-between py-2 text-left text-xs font-bold text-[#0D1B2A] hover:text-primary transition-all duration-300 cursor-pointer">
                   <span class="pr-4 leading-tight font-sans hover:text-primary">{{ item.question }}</span>
                   <mat-icon class="text-muted transition-transform duration-300 pointer-events-none" [class.rotate-180]="expandedFaq() === i">expand_more</mat-icon>
                </button>
                
                <div class="grid transition-all duration-305 ease-in-out" 
                     [style.grid-template-rows]="expandedFaq() === i ? '1fr' : '0fr'">
                   <div class="overflow-hidden">
                      <p class="text-[10px] text-muted leading-relaxed font-semibold mt-2 pb-2">
                         {{ item.answer }}
                      </p>
                   </div>
                </div>
             </div>
          }
       </div>
    </div>
  `
})
export class SavFaqComponent {
  expandedFaq = signal<number | null>(null);

  faqs = signal([
    {
      question: "Quelle est la durée de la garantie ?",
      answer: "La garantie constructeur O'CHAP est de 24 mois (2 ans) minimum sur tous nos produits neufs commandés sur notre boutique."
    },
    {
      question: "Que couvre exactement la garantie ?",
      answer: "La garantie couvre les pannes d'origine électrique, électronique ou mécanique, ainsi que les pièces de rechange et la main-d'œuvre nécessaires certifiées par nos techniciens."
    },
    {
      question: "Comment se passe l'intervention SAV à Abidjan ?",
      answer: "Pour le gros électroménager, un technicien O'CHAP se déplace directement à votre domicile sous 72h ouvrées sans frais de transport pour effectuer le diagnostic."
    },
    {
      question: "Puis-je retourner un appareil qui ne me convient pas ?",
      answer: "Oui, vous disposez de 14 jours d'essai à compter du jour de la réception pour retourner un article dans son emballage d'origine scellé et obtenir un remboursement intégral."
    },
    {
      question: "Quelles sont les exclusions de garantie ?",
      answer: "Sont exclus les dommages dus aux surtensions électriques (nous conseillons un régulateur), une mauvaise utilisation, ou une intervention technique d'un tiers non agréé."
    }
  ]);

  toggleFaq(idx: number) {
    this.expandedFaq.update(current => current === idx ? null : idx);
  }
}
