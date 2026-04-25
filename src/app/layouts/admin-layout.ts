import { ChangeDetectionStrategy, Component, effect, inject, signal, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DataService } from '../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen w-full overflow-hidden bg-[#f0f2f5] font-sans">
      <!-- SIDEBAR -->
      <aside class="flex-shrink-0 bg-[#0D1B2A] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[300] sticky top-0 h-screen" 
             [class.w-[260px]]="!sidebarCollapsed()" 
             [class.w-[80px]]="sidebarCollapsed()">
        
        <div class="p-5 border-b border-white/5 flex items-center justify-between h-[64px]">
          <div class="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#d94f00] flex-shrink-0 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20">E</div>
            @if (!sidebarCollapsed()) {
              <div class="flex flex-col animate-fade-in">
                <span class="text-white font-extrabold text-lg tracking-tight leading-none uppercase italic">O'<span class="text-primary">CHAP</span></span>
                <span class="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mt-1">Admin ERP</span>
              </div>
            }
          </div>
        </div>

        <div class="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          <!-- VUE GLOBALE -->
          <div class="space-y-1">
            <button (click)="toggleSection('global')" 
                    [title]="sidebarCollapsed() ? 'Vue globale' : ''"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent"
                    [class.justify-center]="sidebarCollapsed()">
              <div class="flex items-center gap-3">
                <mat-icon class="scale-75">dashboard</mat-icon> 
                @if (!sidebarCollapsed()) { <span class="animate-fade-in">Vue globale</span> }
              </div>
              @if (!sidebarCollapsed()) {
                <mat-icon class="scale-50 transition-transform" [class.rotate-180]="openSections()['global']">expand_more</mat-icon>
              }
            </button>
            @if (openSections()['global'] && !sidebarCollapsed()) {
              <div class="pl-9 space-y-1 animate-fade-in flex flex-col">
                <a routerLink="/admin/dashboard" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Dashboard</a>
                <a routerLink="/admin/analytics" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Analytiques</a>
              </div>
            }
          </div>

          <!-- OPÉRATIONS -->
          <div class="space-y-1">
            <button (click)="toggleSection('ops')" 
                    [title]="sidebarCollapsed() ? 'Opérations' : ''"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent"
                    [class.justify-center]="sidebarCollapsed()">
              <div class="flex items-center gap-3">
                <mat-icon class="scale-75">settings_input_component</mat-icon> 
                @if (!sidebarCollapsed()) { <span class="animate-fade-in">Opérations</span> }
              </div>
              @if (!sidebarCollapsed()) {
                <mat-icon class="scale-50 transition-transform" [class.rotate-180]="openSections()['ops']">expand_more</mat-icon>
              }
            </button>
            @if (openSections()['ops'] && !sidebarCollapsed()) {
              <div class="pl-9 space-y-1 animate-fade-in flex flex-col">
                <a routerLink="/admin/orders" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Commandes</a>
                <a routerLink="/admin/dispatch" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Dispatch</a>
                <a routerLink="/admin/zones" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Livraisons & Zones</a>
              </div>
            }
          </div>

          <!-- PARTENAIRES -->
          <div class="space-y-1">
            <button (click)="toggleSection('partners')" 
                    [title]="sidebarCollapsed() ? 'Partenaires' : ''"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent"
                    [class.justify-center]="sidebarCollapsed()">
              <div class="flex items-center gap-3">
                <mat-icon class="scale-75">business_center</mat-icon> 
                @if (!sidebarCollapsed()) { <span class="animate-fade-in">Partenaires</span> }
              </div>
              @if (!sidebarCollapsed()) {
                <mat-icon class="scale-50 transition-transform" [class.rotate-180]="openSections()['partners']">expand_more</mat-icon>
              }
            </button>
            @if (openSections()['partners'] && !sidebarCollapsed()) {
              <div class="pl-9 space-y-1 animate-fade-in flex flex-col">
                <a routerLink="/admin/suppliers" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Fournisseurs</a>
                <a routerLink="/admin/customers" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Clients</a>
              </div>
            }
          </div>

          <!-- CATALOGUE -->
          <div class="space-y-1">
            <button (click)="toggleSection('catalog')" 
                    [title]="sidebarCollapsed() ? 'Catalogue' : ''"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent"
                    [class.justify-center]="sidebarCollapsed()">
              <div class="flex items-center gap-3">
                <mat-icon class="scale-75">inventory_2</mat-icon> 
                @if (!sidebarCollapsed()) { <span class="animate-fade-in">Catalogue</span> }
              </div>
              @if (!sidebarCollapsed()) {
                <mat-icon class="scale-50 transition-transform" [class.rotate-180]="openSections()['catalog']">expand_more</mat-icon>
              }
            </button>
            @if (openSections()['catalog'] && !sidebarCollapsed()) {
              <div class="pl-9 space-y-1 animate-fade-in flex flex-col">
                <a routerLink="/admin/products" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Produits</a>
                <a routerLink="/admin/inventory" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Stocks</a>
                <a routerLink="/admin/promo" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Promotions</a>
              </div>
            }
          </div>

          <!-- FINANCE -->
          <div class="space-y-1">
            <button (click)="toggleSection('finance')" 
                    [title]="sidebarCollapsed() ? 'Finance' : ''"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent"
                    [class.justify-center]="sidebarCollapsed()">
              <div class="flex items-center gap-3">
                <mat-icon class="scale-75">account_balance_wallet</mat-icon> 
                @if (!sidebarCollapsed()) { <span class="animate-fade-in">Finance</span> }
              </div>
              @if (!sidebarCollapsed()) {
                <mat-icon class="scale-50 transition-transform" [class.rotate-180]="openSections()['finance']">expand_more</mat-icon>
              }
            </button>
            @if (openSections()['finance'] && !sidebarCollapsed()) {
              <div class="pl-9 space-y-1 animate-fade-in flex flex-col">
                <a routerLink="/admin/billing" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Facturation</a>
                <a routerLink="/admin/reports" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Rapports & Exports</a>
              </div>
            }
          </div>

          <!-- SUPPORT -->
          <div class="space-y-1">
            <button (click)="toggleSection('support')" 
                    [title]="sidebarCollapsed() ? 'Support' : ''"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent"
                    [class.justify-center]="sidebarCollapsed()">
              <div class="flex items-center gap-3">
                <mat-icon class="scale-75">support_agent</mat-icon> 
                @if (!sidebarCollapsed()) { <span class="animate-fade-in">Support</span> }
              </div>
              @if (!sidebarCollapsed()) {
                <mat-icon class="scale-50 transition-transform" [class.rotate-180]="openSections()['support']">expand_more</mat-icon>
              }
            </button>
            @if (openSections()['support'] && !sidebarCollapsed()) {
              <div class="pl-9 space-y-1 animate-fade-in flex flex-col">
                <a routerLink="/admin/support" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Tickets SAV</a>
                <a routerLink="/admin/notifications" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Notifications</a>
              </div>
            }
          </div>

          <!-- ADMIN -->
          <div class="space-y-1">
            <button (click)="toggleSection('admin')" 
                    [title]="sidebarCollapsed() ? 'Admin' : ''"
                    class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent"
                    [class.justify-center]="sidebarCollapsed()">
              <div class="flex items-center gap-3">
                <mat-icon class="scale-75">admin_panel_settings</mat-icon> 
                @if (!sidebarCollapsed()) { <span class="animate-fade-in">Admin</span> }
              </div>
              @if (!sidebarCollapsed()) {
                <mat-icon class="scale-50 transition-transform" [class.rotate-180]="openSections()['admin']">expand_more</mat-icon>
              }
            </button>
            @if (openSections()['admin'] && !sidebarCollapsed()) {
              <div class="pl-9 space-y-1 animate-fade-in flex flex-col">
                <a routerLink="/admin/users" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Utilisateurs & Rôles</a>
                <a routerLink="/admin/settings" routerLinkActive="text-primary font-black scale-105" class="text-[11px] py-1.5 text-white/30 hover:text-white transition-all font-bold origin-left">Paramètres</a>
              </div>
            }
          </div>
        </div>

        <div class="p-4 border-t border-white/5 bg-black/10">
          <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer mb-2 overflow-hidden" [class.justify-center]="sidebarCollapsed()">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-orange-400 flex-shrink-0 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20">
              {{authService.user$()?.displayName?.charAt(0) || 'A'}}
            </div>
            @if (!sidebarCollapsed()) {
              <div class="flex flex-col min-w-0 animate-fade-in">
                 <span class="text-white text-xs font-bold truncate">{{authService.user$()?.displayName || 'Super Admin'}}</span>
                 <span class="text-[9px] text-white/30 font-black uppercase tracking-widest whitespace-nowrap">{{authService.profile$()?.['role'] || 'Admin ERP'}}</span>
              </div>
            }
          </div>
          <button (click)="logout()" 
                  [title]="sidebarCollapsed() ? 'Déconnexion' : ''"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                  [class.justify-center]="sidebarCollapsed()">
            <mat-icon class="scale-75">logout</mat-icon> 
            @if (!sidebarCollapsed()) { <span class="animate-fade-in">Déconnexion</span> }
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="flex-1 flex flex-col min-w-0">
        <header class="h-[64px] bg-white border-b border-[#e4e6ea] flex items-center justify-between px-6 sticky top-0 z-[200]">
          <div class="flex items-center gap-6 flex-1">
             <button (click)="sidebarCollapsed.set(!sidebarCollapsed())" class="w-10 h-10 flex items-center justify-center text-[#5a5e72] hover:text-primary transition-all rounded-xl hover:bg-[#f0f2f5]">
               <mat-icon>{{sidebarCollapsed() ? 'menu' : 'menu_open'}}</mat-icon>
             </button>
             
             <div class="max-w-md w-full relative">
               <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-[#9699a8] scale-75">search</mat-icon>
               <input type="text" class="w-full h-10 bg-[#f0f2f5] border border-transparent rounded-[50px] pl-11 pr-4 text-xs font-bold outline-none focus:bg-white focus:border-primary transition-all" placeholder="Rechercher commandes, clients, produits...">
             </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="px-3 py-1 bg-gradient-to-r from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-full mr-2">Admin ERP</div>
            <button class="w-10 h-10 flex items-center justify-center text-[#5a5e72] hover:text-primary transition-all rounded-xl hover:bg-[#f0f2f5] relative" title="Notifications">
              <mat-icon class="scale-90">notifications</mat-icon>
              <div class="absolute top-2.5 right-3 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></div>
            </button>
            <button class="w-10 h-10 flex items-center justify-center text-[#5a5e72] hover:text-primary transition-all rounded-xl hover:bg-[#f0f2f5]" title="Aide">
              <mat-icon class="scale-90">help_outline</mat-icon>
            </button>
            <div class="w-[1.5px] h-6 bg-[#e4e6ea] mx-2"></div>
            <div class="w-8 h-8 rounded-full bg-[#f0f2f5] flex items-center justify-center text-primary font-black text-[10px] border border-[#e4e6ea] cursor-pointer hover:border-primary transition-all">
               {{authService.user$()?.displayName?.charAt(0) || 'A'}}
            </div>
          </div>
        </header>
        
        <div class="flex-1 overflow-auto p-8 relative no-scrollbar">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
    aside .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
  `]
})
export class AdminLayoutComponent implements OnDestroy {
  public authService = inject(AuthService);
  public dataService = inject(DataService);
  private router = inject(Router);
  private unsubs: (() => void)[] = [];
  sidebarCollapsed = signal(false);

  constructor() {
    effect(() => {
      const user = this.authService.user$();
      const isAdmin = this.authService.isAdmin();
      
      // Nettoyage des abonnements précédents
      this.unsubs.forEach(unsub => unsub());
      this.unsubs = [];

      if (user && isAdmin) {
        console.log('Admin detected: Starting global ERP data sync...');
        this.unsubs.push(this.dataService.watchAllOrders());
        this.unsubs.push(this.dataService.watchAllProducts());
        this.unsubs.push(this.dataService.watchAllUsers());
        this.unsubs.push(this.dataService.watchAllZones());
      }
    });
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => unsub());
  }
  
  openSections = signal<Record<string, boolean>>({
    global: true,
    ops: false,
    partners: false,
    catalog: false,
    finance: false,
    support: false,
    admin: false
  });

  toggleSection(section: string) {
    this.openSections.update(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
