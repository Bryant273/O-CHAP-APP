import { ChangeDetectionStrategy, Component, inject, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Unsubscribe } from 'firebase/firestore';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
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
        <div class="w-24"></div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-12">
        <div class="flex items-center justify-between gap-6 mb-12">
           <div>
              <h1 class="text-4xl font-black text-ink tracking-tighter mb-2">Flux d'Activité.</h1>
              <p class="text-[10px] font-black text-muted uppercase tracking-widest">Historique des alertes et notifications système</p>
           </div>
           
           @if (notifications().length > 0) {
              <button (click)="markAllAsRead()" class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline active:scale-95 transition-all">
                Tout marquer comme lu
              </button>
           }
        </div>

        @if (notifications().length > 0) {
              <div class="space-y-3">
                 @for (n of notifications(); track n['id']) {
                    <div [class.bg-white]="n['read']"
                         [class.bg-primary/5]="!n['read']"
                         [class.border-primary/20]="!n['read']"
                         class="group relative flex items-start gap-4 p-6 rounded-3xl border border-surface-2 hover:shadow-xl hover:shadow-ink/5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                         tabindex="0"
                         (click)="markAsRead(asString(n['id']))"
                         (keydown.enter)="markAsRead(asString(n['id']))">
                      
                      <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                       [class.bg-amber-100]="n['type'] === 'low_stock'"
                       [class.text-amber-600]="n['type'] === 'low_stock'"
                       [class.bg-emerald-100]="n['type'] === 'order_confirmed'"
                       [class.text-emerald-600]="n['type'] === 'order_confirmed'"
                       [class.bg-blue-100]="n['type'] !== 'low_stock' && n['type'] !== 'order_confirmed'"
                       [class.text-blue-600]="n['type'] !== 'low_stock' && n['type'] !== 'order_confirmed'">
                    <mat-icon>{{ getIcon(asString(n['type'])) }}</mat-icon>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-4 mb-1">
                      <h3 class="text-xs font-black text-ink uppercase tracking-wider truncate">{{ n['title'] }}</h3>
                      <span class="text-[9px] font-black text-muted uppercase font-mono whitespace-nowrap">{{ formatTime(n['createdAt']) }}</span>
                    </div>
                    <p class="text-xs font-medium text-muted leading-relaxed">{{ n['message'] }}</p>
                  </div>

                  @if (!n['read']) {
                    <div class="absolute top-6 right-3 w-1.5 h-1.5 bg-primary rounded-full"></div>
                  }
                </div>
             }
          </div>
        } @else {
          <div class="py-40 flex flex-col items-center justify-center text-center">
             <div class="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-ink/5 mb-8 opacity-20">
                <mat-icon class="scale-150">notifications_none</mat-icon>
             </div>
             <h2 class="text-2xl font-display font-medium text-ink mb-4 opacity-50">Aucune notification.</h2>
             <p class="text-muted text-sm max-w-xs opacity-50">Votre historique est vide pour le moment.</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NotificationsComponent implements OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  notifications = this.dataService.notifications$;
  private unsub?: Unsubscribe;

  constructor() {
    effect(() => {
      const user = this.authService.user$();
      if (user) {
        if (this.unsub) this.unsub();
        this.unsub = this.dataService.watchNotifications(user.uid);
      }
    });
  }

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  asString(val: unknown): string { return val as string; }

  getIcon(type: string): string {
    switch(type) {
      case 'low_stock': return 'inventory';
      case 'order_confirmed': return 'shopping_bag';
      case 'promo': return 'local_offer';
      default: return 'notifications';
    }
  }

  formatTime(timestamp: unknown): string {
    if (!timestamp) return 'Récemment';
    try {
      const ts = timestamp as { toDate?: () => Date };
      const date = ts.toDate ? ts.toDate() : new Date(timestamp as string | number | Date);
      return new Intl.RelativeTimeFormat('fr', { numeric: 'auto' }).format(
        Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        'day'
      );
    } catch { return '...'; }
  }

  markAsRead(id: string) {
    this.dataService.markNotificationRead(id);
  }

  markAllAsRead() {
    this.notifications().forEach(n => {
      if (!n['read']) this.markAsRead(this.asString(n['id']));
    });
  }
}
