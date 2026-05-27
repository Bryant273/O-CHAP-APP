import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in font-sans">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Support & SAV</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Centre de support et résolution des litiges O'CHAP Afrique</p>
        </div>
      </div>

      <!-- Ticket Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div class="bg-white p-6 rounded-2xl border border-[#e4e6ea] shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
               <mat-icon>assignment</mat-icon>
            </div>
            <div>
               <div class="text-2xl font-display font-black text-[#0D1B2A]">{{ totalCount() }}</div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">Total Tickets SAV</div>
            </div>
         </div>
         <div class="bg-white p-6 rounded-2xl border border-[#e4e6ea] shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center animate-pulse">
               <mat-icon>hourglass_empty</mat-icon>
            </div>
            <div>
               <div class="text-2xl font-display font-black text-[#0D1B2A]">{{ pendingCount() }}</div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">En attente (Pending)</div>
            </div>
         </div>
         <div class="bg-white p-6 rounded-2xl border border-[#e4e6ea] shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <mat-icon>check_circle</mat-icon>
            </div>
            <div>
               <div class="text-2xl font-display font-black text-[#0D1B2A]">{{ resolvedCount() }}</div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">Résolus (Resolved)</div>
            </div>
         </div>
      </div>

      <!-- Filters & Tickets Table -->
      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
         <!-- Filter Header -->
         <div class="px-8 py-6 border-b border-[#e4e6ea] bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 class="text-xs font-black text-[#0D1B2A] uppercase tracking-widest flex items-center gap-3">
               <mat-icon class="scale-75 text-primary">support_agent</mat-icon>
               Liste des Demandes SAV
            </h3>
            
            <!-- Status Filter Tabs -->
            <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-[9px] font-black uppercase tracking-wider">
               <button (click)="filterStatus.set('all')" 
                       [class]="filterStatus() === 'all' ? 'bg-white text-navy shadow-sm' : 'text-[#5a5e72] hover:text-[#0D1B2A]'"
                       class="px-4 py-1.5 rounded-lg transition-all">Tout</button>
               <button (click)="filterStatus.set('pending')" 
                       [class]="filterStatus() === 'pending' ? 'bg-white text-amber-600 shadow-sm' : 'text-[#5a5e72] hover:text-[#0D1B2A]'"
                       class="px-4 py-1.5 rounded-lg transition-all">En attente</button>
               <button (click)="filterStatus.set('resolved')" 
                       [class]="filterStatus() === 'resolved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-[#5a5e72] hover:text-[#0D1B2A]'"
                       class="px-4 py-1.5 rounded-lg transition-all font-bold">Résolus</button>
            </div>
         </div>

         <!-- Ticket list -->
         <div class="p-8">
            @if (filteredRequests().length === 0) {
               <div class="py-16 text-center text-slate-400 italic flex flex-col items-center justify-center">
                  <mat-icon class="scale-[2.5] text-slate-300 mb-4">forum</mat-icon>
                  <p class="text-sm font-bold text-muted">Aucun ticket disponible pour ce filtre</p>
               </div>
            } @else {
               <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                     <thead>
                        <tr class="border-b border-[#e4e6ea] text-[10px] font-black uppercase text-muted tracking-widest pb-4">
                           <th class="py-4">Ticket Info</th>
                           <th class="py-4">Article & Type</th>
                           <th class="py-4">Problème (Description)</th>
                           <th class="py-4 text-center">Statut</th>
                           <th class="py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody class="divide-y divide-[#e4e6ea] text-xs">
                        @for (req of filteredRequests(); track req.id) {
                           <tr class="hover:bg-[#fafbfc] transition-all duration-1000 border-l-4"
                               [class.border-l-emerald-500]="req.status === 'resolved'"
                               [class.border-l-amber-500]="req.status === 'pending'"
                               [class.bg-emerald-50/15]="req.status === 'resolved'"
                               [class.bg-amber-50/5]="req.status === 'pending'">
                              <td class="py-5 font-medium pl-3">
                                 <div class="flex flex-col gap-0.5">
                                    <span class="font-black text-[#0D1B2A] font-mono">#{{ req.id.slice(-6).toUpperCase() }}</span>
                                    <span class="text-[10px] text-muted font-bold">Client ID: {{ req.customerUid.slice(-8) || 'Inconnu' }}</span>
                                    <span class="text-[9px] text-[#9699a8] mt-0.5">{{ formatDate(req.createdAt) }}</span>
                                 </div>
                              </td>
                              <td class="py-5">
                                 <div class="flex flex-col">
                                    <span class="font-black text-[#0D1B2A] uppercase max-w-[180px] truncate" [title]="req.productName">{{ req.productName }}</span>
                                    <span class="inline-flex max-w-fit items-center gap-1 mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                                       <mat-icon class="scale-50 -ml-0.5 -mt-0.5">build</mat-icon>
                                       {{ req.type }}
                                    </span>
                                 </div>
                              </td>
                              <td class="py-5 max-w-[300px]">
                                 <p class="text-[#0D1B2A] font-medium leading-relaxed italic line-clamp-2" [title]="req.description">
                                    "{{ req.description }}"
                                 </p>
                              </td>
                              <td class="py-5 text-center">
                                 @if (req.status === 'resolved') {
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                                       ● RESOLVED
                                    </span>
                                 } @else {
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-100 animate-pulse">
                                       ● PENDING
                                    </span>
                                 }
                              </td>
                              <td class="py-5 text-right">
                                 <div class="flex items-center justify-end gap-2 text-[#0D1B2A]">
                                    @if (req.status === 'pending') {
                                       <button (click)="markAsResolved(req.id)"
                                               class="h-8 px-4 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-750 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer">
                                          <mat-icon class="scale-75">done</mat-icon>
                                          Résoudre
                                       </button>
                                    } @else {
                                       <button (click)="markAsPending(req.id)"
                                               class="h-8 px-4 rounded-lg bg-amber-655 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/10 cursor-pointer">
                                          <mat-icon class="scale-75">replay</mat-icon>
                                          Réactiver
                                       </button>
                                    }
                                 </div>
                              </td>
                           </tr>
                        }
                     </tbody>
                  </table>
               </div>
            }
         </div>
      </div>
    </div>
  `,
  styles: [`
    tr {
      transition: background-color 1s cubic-bezier(0.4, 0, 0.2, 1), border-color 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class AdminSupport implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private unsubSavRequests?: () => void;

  public filterStatus = signal<string>('all');

  // Compute stats on savRequests signal
  public totalCount = computed(() => this.dataService.savRequests$().length);
  public pendingCount = computed(() => this.dataService.savRequests$().filter(r => r.status === 'pending').length);
  public resolvedCount = computed(() => this.dataService.savRequests$().filter(r => r.status === 'resolved').length);

  // Filter requests
  public filteredRequests = computed(() => {
    const all = this.dataService.savRequests$();
    const filter = this.filterStatus();
    if (filter === 'all') return all;
    return all.filter(r => r.status === filter);
  });

  ngOnInit() {
    this.unsubSavRequests = this.dataService.watchAllSavRequests();
  }

  ngOnDestroy() {
    if (this.unsubSavRequests) {
      this.unsubSavRequests();
    }
  }

  formatDate(timestamp: unknown): string {
    if (!timestamp) return '...';
    try {
      const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp
        ? (timestamp as { toDate: () => Date }).toDate()
        : new Date(timestamp as string | number | Date);
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    } catch { return '...'; }
  }

  async markAsResolved(id: string) {
    await this.dataService.updateSavRequestStatus(id, 'resolved');
  }

  async markAsPending(id: string) {
    await this.dataService.updateSavRequestStatus(id, 'pending');
  }
}
