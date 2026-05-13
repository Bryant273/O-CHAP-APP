import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Utilisateurs & Rôles</h2>
          <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Administration des accès et privilèges O'CHAP Afrique</p>
        </div>
        <button class="bg-primary text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2">
           <mat-icon class="scale-75">person_add</mat-icon> Créer un accès
        </button>
      </div>

      <!-- User Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div class="bg-white p-4 rounded-xl border border-surface-2 shadow-sm flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><mat-icon class="scale-75">admin_panel_settings</mat-icon></div>
            <div>
               <div class="text-xl font-display font-bold text-navy">{{adminsCount()}}</div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">Administrateurs</div>
            </div>
         </div>
         <div class="bg-white p-4 rounded-xl border border-surface-2 shadow-sm flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><mat-icon class="scale-75">storefront</mat-icon></div>
            <div>
               <div class="text-xl font-display font-bold text-navy">{{suppliersCount()}}</div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">Marchands</div>
            </div>
         </div>
         <div class="bg-white p-4 rounded-xl border border-surface-2 shadow-sm flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><mat-icon class="scale-75">groups</mat-icon></div>
            <div>
               <div class="text-xl font-display font-bold text-navy">{{clientsCount()}}</div>
               <div class="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">Clients</div>
            </div>
         </div>
      </div>

      <!-- Lists Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- ADMINS & PARTNERS -->
        <div class="space-y-6">
           <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
             <div class="px-8 py-6 border-b border-[#e4e6ea] bg-[#fafbfc]">
                <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest flex items-center gap-3">
                   <mat-icon class="scale-75 text-primary">security</mat-icon>
                   Équipe Administrative
                </h3>
             </div>
             <div class="p-4 space-y-2">
                @if (admins().length === 0) {
                   <div class="p-8 text-center text-[10px] font-bold text-[#9699a8] italic">Sync en cours...</div>
                }
                @for (user of admins(); track user.id) {
                   <div class="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-[#e4e6ea] hover:bg-[#fafbfc] transition-all group">
                      <div class="flex items-center gap-4">
                         <div class="w-10 h-10 rounded-xl bg-[#0D1B2A] text-white flex items-center justify-center font-black text-xs">
                            {{user.displayName?.charAt(0) || 'A'}}
                         </div>
                         <div>
                            <div class="text-xs font-black text-[#0D1B2A]">{{user.displayName || 'Sans Nom'}}</div>
                            <div class="text-[9px] text-[#9699a8] font-bold italic">{{user.email}}</div>
                         </div>
                      </div>
                      <div class="flex items-center gap-3">
                         <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">Super Admin</span>
                         <button class="w-8 h-8 rounded-lg flex items-center justify-center text-[#9699a8] hover:bg-white hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                            <mat-icon class="scale-75">more_vert</mat-icon>
                         </button>
                      </div>
                   </div>
                }
             </div>
           </div>

           <!-- SUPPLIERS -->
           <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden">
             <div class="px-8 py-6 border-b border-[#e4e6ea] bg-[#fafbfc]">
                <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest flex items-center gap-3">
                   <mat-icon class="scale-75 text-emerald-600">storefront</mat-icon>
                   Marchands Partenaires
                </h3>
             </div>
             <div class="p-4 space-y-2">
                @if (suppliers().length === 0) {
                   <div class="p-12 text-center text-[10px] font-bold text-[#9699a8] italic uppercase tracking-widest">Aucun marchand actif</div>
                }
                @for (user of suppliers(); track user.id) {
                   <div class="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-[#e4e6ea] hover:bg-[#fafbfc] transition-all group">
                      <div class="flex items-center gap-4">
                         @if (user.photoURL) {
                            <img [src]="user.photoURL" alt="Profil Marchand O'CHAP" class="w-10 h-10 rounded-xl object-cover border border-[#e4e6ea]">
                         } @else {
                            <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs">
                               {{user.displayName?.charAt(0) || 'M'}}
                            </div>
                         }
                         <div>
                            <div class="text-xs font-black text-[#0D1B2A]">{{user.displayName}}</div>
                            <div class="text-[9px] text-[#9699a8] font-bold">{{user.email}}</div>
                         </div>
                      </div>
                      <div class="flex items-center gap-2">
                         <span class="px-2 py-0.5 rounded-full bg-[#f0f2f5] text-[#5a5e72] text-[8px] font-black uppercase tracking-widest">Supplier</span>
                         <mat-icon class="text-emerald-500 scale-50">verified_user</mat-icon>
                      </div>
                   </div>
                }
             </div>
           </div>
        </div>

        <!-- MAINTENANCE & RECENT CLIENTS -->
        <div class="space-y-6">
           <!-- Maintenance / Admin tools (Relocated) -->
           @if (isSuperAdmin()) {
             <div class="bg-[#0D1B2A] p-8 rounded-[2.5rem] text-white border border-white/5 relative overflow-hidden shadow-2xl">
               <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
               
               <div class="relative z-10">
                 <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40">
                       <mat-icon class="scale-90">shutter_speed</mat-icon>
                    </div>
                    <div>
                       <h3 class="text-sm font-black text-white tracking-widest uppercase">Maintenance O'CHAP</h3>
                       <p class="text-[9px] text-white/40 font-bold italic mt-1 font-mono tracking-tighter">ENGINE_V2_CORE_CLEANUP</p>
                    </div>
                 </div>

                 <div class="space-y-4">
                    <div class="p-5 rounded-[1.5rem] bg-white/5 border border-white/10 space-y-3">
                       <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                             <mat-icon class="text-primary scale-75">person_remove</mat-icon>
                             <span class="text-[10px] font-black uppercase tracking-widest text-white/80">Purge de test</span>
                          </div>
                          @if (maintenanceStatus()) {
                             <span class="text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full animate-pulse">{{maintenanceStatus()}}</span>
                          }
                       </div>
                       <p class="text-[10px] text-white/40 leading-relaxed italic">Supprime <span class="text-primary font-bold">test-fournisseur@ochap.com</span> et synchronise l'ERP.</p>
                       
                       <button (click)="clearTestSupplier()" 
                               [disabled]="loadingMaintenance()"
                               class="w-full mt-2 h-11 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                          @if (loadingMaintenance()){ <mat-icon class="animate-spin scale-75">autorenew</mat-icon> }
                          {{loadingMaintenance() ? 'Opération en cours' : 'Exécuter la Purge'}}
                       </button>
                    </div>
                 </div>
               </div>
             </div>
           }

           <!-- CLIENT LIST (Simplified) -->
           <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm overflow-hidden flex-1">
             <div class="px-8 py-6 border-b border-[#e4e6ea] bg-[#fafbfc] flex items-center justify-between">
                <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest flex items-center gap-3">
                   <mat-icon class="scale-75 text-blue-600">groups</mat-icon>
                   Derniers Clients
                </h3>
                <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{{clientsCount()}}</span>
             </div>
             <div class="p-4 space-y-1">
                @for (user of clients().slice(0, 8); track user.id) {
                   <div class="flex items-center justify-between p-3 rounded-xl hover:bg-[#f8f9fa] transition-all">
                      <div class="flex items-center gap-3">
                         <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">
                            {{user.displayName?.charAt(0) || 'C'}}
                         </div>
                         <div class="min-w-0">
                            <div class="text-[11px] font-black text-[#0D1B2A] truncate">{{user.displayName}}</div>
                            <div class="text-[9px] text-[#9699a8] font-bold">{{user.email}}</div>
                         </div>
                      </div>
                      <span class="text-[9px] font-black text-blue-600 uppercase">Client</span>
                   </div>
                }
             </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminUsers {
  public authService = inject(AuthService);
  public dataService = inject(DataService);

  loadingMaintenance = signal(false);
  maintenanceStatus = signal<string | null>(null);

  // COMPUTED SIGNALS FROM DATA SERVICE (Unified)
  admins = computed(() => this.dataService.users$().filter(u => u.role === 'admin'));
  suppliers = this.dataService.suppliers$;
  clients = this.dataService.clients$;

  adminsCount = computed(() => this.admins().length);
  suppliersCount = computed(() => this.suppliers().length);
  clientsCount = computed(() => this.clients().length);

  isSuperAdmin = computed(() => {
    const email = this.authService.user$()?.email?.toLowerCase();
    return email === 'acherie812@gmail.com' || email === 'test-admin@ochap.com';
  });

  async clearTestSupplier() {
    const email = 'test-fournisseur@ochap.com';
    this.loadingMaintenance.set(true);
    this.maintenanceStatus.set('PURGE_SYNC...');
    
    try {
      await this.dataService.deleteUserByEmail(email);
      this.maintenanceStatus.set('BASE_CLEANED');
      setTimeout(() => this.maintenanceStatus.set(null), 5000);
    } catch (err: unknown) {
      console.error(err);
      this.maintenanceStatus.set('SYNC_ERROR');
    } finally {
      this.loadingMaintenance.set(false);
    }
  }
}
