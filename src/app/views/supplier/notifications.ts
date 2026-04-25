import { ChangeDetectionStrategy, Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-supplier-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-6 animate-fade-in relative z-10">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-[#0D1B2A] tracking-tight uppercase italic">Centre de notifications</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium">Historique de votre activité et alertes système</p>
        </div>
        <button (click)="markAllRead()" class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
          Tout marquer comme lu
        </button>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
        <div class="divide-y divide-[#f0f2f5]">
          @for (note of notifications(); track note.id) {
            <div class="p-8 hover:bg-[#fcfcfd] transition-all flex gap-6" [class.bg-blue-50/20]="!note.read">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                   [class]="getIconClass(note.type)">
                <mat-icon>{{ getIcon(note.type) }}</mat-icon>
              </div>
              <div class="flex-1">
                <div class="flex items-start justify-between gap-4 mb-2">
                  <h3 class="text-sm font-black text-[#0D1B2A] italic">{{ note.title }}</h3>
                  <span class="text-[9px] font-bold text-[#9699a8] uppercase tracking-tighter">{{ formatTime(note.createdAt) }}</span>
                </div>
                <p class="text-xs font-medium text-[#5a5e72] leading-relaxed mb-4 max-w-2xl">{{ note.message }}</p>
                
                @if (!note.read) {
                  <button (click)="dataService.markNotificationRead(note.id)" 
                          class="bg-[#0D1B2A] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all">
                    Marquer comme lu
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="py-32 text-center opacity-30">
              <mat-icon class="scale-[3] mb-8 text-[#0D1B2A]">notifications_none</mat-icon>
              <h3 class="text-sm font-black uppercase tracking-widest italic">Aucun message</h3>
              <p class="text-xs font-medium mt-2">Vous n'avez pas encore de notifications.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SupplierNotifications implements OnInit {
  public dataService = inject(DataService);
  private authService = inject(AuthService);
  
  notifications = computed(() => this.dataService.notifications$());

  ngOnInit() {
    const user = this.authService.user$();
    if (user) {
      this.dataService.watchNotifications(user.uid);
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'order': return 'shopping_bag';
      case 'stock': return 'warehouse';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'order': return 'bg-[#e8f4fd] text-[#0984e3]';
      case 'stock': return 'bg-[#fdedec] text-[#e17055]';
      case 'system': return 'bg-[#f0f2f5] text-[#5a5e72]';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  formatTime(createdAt: any): string {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  async markAllRead() {
    for (const note of this.notifications()) {
      if (!note.read) {
        await this.dataService.markNotificationRead(note.id);
      }
    }
  }
}
