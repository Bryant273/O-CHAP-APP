import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-marketing',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-10 animate-fade-up px-6 lg:px-8 pb-24">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
           <h2 class="text-4xl font-black text-ink tracking-tighter">Marketing Automation.</h2>
           <p class="text-xs font-bold text-muted mt-2 uppercase tracking-[0.2em] opacity-60">Génération de campagnes par Intelligence Artificielle</p>
        </div>
        <button (click)="generateCampaigns()" 
                [disabled]="isLoading()"
                class="px-8 h-14 bg-primary text-white rounded-2xl flex items-center justify-center gap-4 hover:bg-navy transition-all active:scale-95 shadow-2xl shadow-primary/20 disabled:opacity-50 group">
           <mat-icon [class.animate-spin]="isLoading()">{{ isLoading() ? 'autorenew' : 'auto_awesome' }}</mat-icon>
           <span class="text-[11px] font-black uppercase tracking-widest">{{ isLoading() ? 'Génération en cours...' : 'Lancer l&apos;Automation' }}</span>
        </button>
      </div>

      @if (campaigns().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           @for (c of campaigns(); track $index) {
              <div class="bg-white rounded-[2.5rem] border border-surface-2 p-10 hover:shadow-2xl hover:shadow-black/5 transition-all group duration-500 flex flex-col h-full">
                 <div class="flex items-center justify-between mb-8">
                    <div class="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center text-ink group-hover:bg-primary group-hover:text-white transition-all">
                       <mat-icon>{{ getIcon(c.type) }}</mat-icon>
                    </div>
                    <span [class]="getTypeClass(c.type)" class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                       {{ c.type }}
                    </span>
                 </div>

                 <h3 class="text-xl font-black text-ink tracking-tight mb-4 group-hover:text-primary transition-colors">{{ c.title }}</h3>
                 
                 <div class="bg-surface/40 p-6 rounded-2xl border border-surface-2/60 mb-8 flex-grow">
                    <p class="text-[13px] font-medium text-muted leading-relaxed">{{ c.content }}</p>
                 </div>

                 <div class="pt-8 border-t border-surface-2 mt-auto">
                    <p class="text-[9px] font-black text-ink uppercase tracking-widest mb-4">Cible : {{ c.audience }}</p>
                    <button class="w-full h-12 rounded-xl bg-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95">
                       Planifier & Envoyer
                    </button>
                 </div>
              </div>
           }
        </div>
      } @else if (!isLoading()) {
         <!-- Empty State -->
         <div class="py-32 flex flex-col items-center justify-center text-center opacity-40">
            <div class="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center mb-6">
               <mat-icon class="scale-[2] text-ink">campaign</mat-icon>
            </div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-ink">Aucune campagne générée.</p>
            <p class="text-[11px] font-bold text-muted mt-2 max-w-[240px]">Cliquez sur le bouton ci-dessus pour que Gemini propose des stratégies basées sur votre stock actuel.</p>
         </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-up { animation: fadeUp 0.6s ease-out forwards; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminMarketing {
  private dataService = inject(DataService);
  
  campaigns = signal<any[]>([]);
  isLoading = signal(false);

  async generateCampaigns() {
    this.isLoading.set(true);
    try {
      const results = await this.dataService.runMarketingAutomation();
      this.campaigns.set(results);
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getIcon(type: string): string {
    switch(type.toLowerCase()) {
      case 'sms': return 'textsms';
      case 'email': return 'alternate_email';
      default: return 'notifications_active';
    }
  }

  getTypeClass(type: string): string {
    switch(type.toLowerCase()) {
      case 'email': return 'bg-blue-50 text-blue-600';
      case 'sms': return 'bg-purple-50 text-purple-600';
      default: return 'bg-amber-50 text-amber-600';
    }
  }
}
