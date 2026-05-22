import { ChangeDetectionStrategy, Component, inject, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService, OchapOrder } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Unsubscribe } from 'firebase/firestore';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-supplier-tracking',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <div>
        <h2 class="text-xl font-black text-[#0D1B2A] tracking-tight uppercase">Suivi livraisons</h2>
        <p class="text-xs text-[#5a5e72] mt-1 font-medium">Vue d'ensemble des expéditions en cours vers vos clients</p>
      </div>

      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
        <div class="overflow-x-auto no-scrollbar">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-[#f8f9fa]">
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Référence</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Client</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Destination</th>
                <th class="px-8 py-5 text-left text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Statut</th>
                <th class="px-8 py-5 text-right text-[10px] font-black text-[#5a5e72]/60 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (o of activeDeliveries(); track o['id']) {
                <tr class="hover:bg-[#fafafa] transition-colors border-t border-[#e4e6ea]">
                  <td class="px-8 py-6">
                    <span class="text-xs font-black text-[#0D1B2A] font-mono tracking-tight uppercase">#{{ asString(o['id']).slice(-8) }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-xs font-bold text-[#0D1B2A]">{{ o['customerName'] }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-[10px] font-medium text-[#5a5e72]">{{ o['deliveryAddress'] || o['deliveryZone'] }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span [class]="getStatusClass(asString(o['status']))" class="text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                      <mat-icon class="scale-50">local_shipping</mat-icon>
                      {{ getStatusLabel(asString(o['status'])) }}
                    </span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <button class="w-9 h-9 rounded-xl bg-[#e8f4fd] text-[#0984e3] hover:scale-105 active:scale-95 transition-all inline-flex items-center justify-center">
                      <mat-icon class="scale-75">near_me</mat-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                   <td colspan="5" class="py-24 text-center opacity-30">
                      <mat-icon class="scale-[3] mb-6">local_shipping</mat-icon>
                      <h3 class="text-sm font-black uppercase tracking-widest">Aucune expédition active</h3>
                      <p class="text-[10px] font-medium mt-2">Les commandes en cours de livraison apparaîtront ici.</p>
                   </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SupplierTracking implements OnDestroy {
  public authService = inject(AuthService);
  private dataService = inject(DataService);
  
  private rawOrders = this.dataService.orders$;
  public orders = computed(() => this.rawOrders() as OchapOrder[]);
  
  private unsub?: Unsubscribe;

  constructor() {
    // Watch profile changes reactively to sync layout / auth state
    toObservable(this.authService.profile$).subscribe(profile => {
      const user = this.authService.user$();
      
      if (this.unsub) {
        this.unsub();
        this.unsub = undefined;
      }
      
      if (user && profile) {
        if (this.authService.isSupplier()) {
          this.unsub = this.dataService.watchSupplierOrders(user.uid);
        } else {
          this.unsub = this.dataService.watchUserOrders(user.uid);
        }
      }
    });
  }

  activeDeliveries = computed(() => {
    return this.orders().filter(o => ['shipped', 'preparing', 'confirmed'].includes(this.asString(o.status)));
  });

  ngOnDestroy() {
    if (this.unsub) this.unsub();
  }

  asString(val: unknown): string { return String(val || ''); }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'confirmed': return 'Validée';
      case 'preparing': return 'Préparation';
      case 'shipped': return 'En livraison';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'confirmed': return 'bg-[#e8f4fd] text-[#0984e3]';
      case 'preparing': return 'bg-[#fef9e6] text-[#f39c12]';
      case 'shipped': return 'bg-[#e8fdf5] text-[#00b894]';
      default: return 'bg-[#f0f2f5] text-[#5a5e72]';
    }
  }
}
