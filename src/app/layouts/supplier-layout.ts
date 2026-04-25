import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-supplier-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen w-full overflow-hidden bg-[#f8f9fa] font-sans text-[#1a1a2e]">
      
      <!-- Sidebar Backdrop (Mobile) -->
      <div 
        class="fixed inset-0 bg-[#0D1B2A]/40 backdrop-blur-sm z-[280] transition-opacity lg:hidden"
        [class.opacity-100]="mobileMenuOpen()"
        [class.visible]="mobileMenuOpen()"
        [class.opacity-0]="!mobileMenuOpen()"
        [class.invisible]="!mobileMenuOpen()"
        (click)="mobileMenuOpen.set(false)"
        (keydown.escape)="mobileMenuOpen.set(false)"
        tabindex="-1"
        role="presentation"
      ></div>

      <!-- SIDEBAR PRESTIGE -->
      <aside 
        class="fixed inset-y-0 left-0 bg-white border-r border-[#e4e6ea] flex flex-col z-[300] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:relative lg:translate-x-0"
        [class.-translate-x-full]="!mobileMenuOpen()"
        [class.translate-x-0]="mobileMenuOpen()"
        [class.w-[260px]]="!sidebarCollapsed()"
        [class.w-[80px]]="sidebarCollapsed()"
      >
        <div class="p-8 pb-6 h-[100px] flex items-center overflow-hidden">
          <div class="flex flex-col whitespace-nowrap overflow-hidden">
            <div class="text-2xl font-black text-[#0D1B2A] tracking-tighter italic">
              <span class="text-primary">O'</span>CHAP<span class="text-primary">.</span>
            </div>
            @if (!sidebarCollapsed()) {
              <div class="flex items-center gap-2 mt-1 animate-fade-in">
                 <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                 <span class="text-[9px] text-[#9699a8] font-black uppercase tracking-widest">Espace Marchand</span>
              </div>
            }
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-8">
          <!-- Main Section -->
          <div class="space-y-1">
            @if (!sidebarCollapsed()) {
              <div class="px-4 text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em] mb-4 animate-fade-in">Pilotage</div>
            }
            
            <a routerLink="/supplier/dashboard" routerLinkActive="bg-[#f0f2f5] !text-[#0D1B2A] ring-1 ring-[#e4e6ea]" [routerLinkActiveOptions]="{exact: true}" class="nav-item" [class.justify-center]="sidebarCollapsed()" title="Vue d'ensemble">
              <mat-icon class="scale-90 flex-shrink-0">dashboard</mat-icon>
              @if (!sidebarCollapsed()) { <span class="animate-fade-in">Vue d'ensemble</span> }
            </a>

            <a routerLink="/supplier/orders" routerLinkActive="bg-[#f0f2f5] !text-[#0D1B2A] ring-1 ring-[#e4e6ea]" class="nav-item" [class.justify-center]="sidebarCollapsed()" [title]="sidebarCollapsed() ? 'Ventes & Commandes' : ''">
              <mat-icon class="scale-90 flex-shrink-0">local_mall</mat-icon>
              @if (!sidebarCollapsed()) {
                <span class="animate-fade-in">Ventes & Commandes</span>
                @if (dataService.pendingOrdersCount() > 0) {
                  <span class="ml-auto bg-primary text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-primary/20">{{dataService.pendingOrdersCount()}}</span>
                }
              }
            </a>

            <a routerLink="/supplier/tracking" routerLinkActive="bg-[#f0f2f5] !text-[#0D1B2A] ring-1 ring-[#e4e6ea]" class="nav-item" [class.justify-center]="sidebarCollapsed()" [title]="sidebarCollapsed() ? 'Flux Logistique' : ''">
              <mat-icon class="scale-90 flex-shrink-0">near_me</mat-icon>
              @if (!sidebarCollapsed()) { <span class="animate-fade-in">Flux Logistique</span> }
            </a>
          </div>

          <!-- Inventory Section -->
          <div class="space-y-1">
            @if (!sidebarCollapsed()) {
              <div class="px-4 text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em] mb-4 animate-fade-in">Mon Magasin</div>
            }

            <a routerLink="/supplier/products" routerLinkActive="bg-[#f0f2f5] !text-[#0D1B2A] ring-1 ring-[#e4e6ea]" class="nav-item" [class.justify-center]="sidebarCollapsed()" [title]="sidebarCollapsed() ? 'Catalogue Articles' : ''">
              <mat-icon class="scale-90 flex-shrink-0">category</mat-icon>
              @if (!sidebarCollapsed()) { <span class="animate-fade-in">Catalogue Articles</span> }
            </a>

            <a routerLink="/supplier/inventory" routerLinkActive="bg-[#f0f2f5] !text-[#0D1B2A] ring-1 ring-[#e4e6ea]" class="nav-item" [class.justify-center]="sidebarCollapsed()" [title]="sidebarCollapsed() ? 'Gestion des Stocks' : ''">
              <mat-icon class="scale-90 flex-shrink-0">inventory_2</mat-icon>
              @if (!sidebarCollapsed()) { 
                <span class="animate-fade-in">Gestion des Stocks</span> 
                @if (dataService.lowStockCount() > 0) {
                  <span class="ml-auto bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-red-500/20">{{dataService.lowStockCount()}}</span>
                }
              }
            </a>
          </div>

          <!-- Account Section -->
          <div class="space-y-1">
            @if (!sidebarCollapsed()) {
              <div class="px-4 text-[10px] font-black text-[#9699a8] uppercase tracking-[0.2em] mb-4 animate-fade-in">Configuration</div>
            }
            
            <a routerLink="/supplier/settings" routerLinkActive="bg-[#f0f2f5] !text-[#0D1B2A] ring-1 ring-[#e4e6ea]" class="nav-item" [class.justify-center]="sidebarCollapsed()" [title]="sidebarCollapsed() ? 'Profil Boutique' : ''">
              <mat-icon class="scale-90 flex-shrink-0">person_settings</mat-icon>
              @if (!sidebarCollapsed()) { <span class="animate-fade-in">Profil Boutique</span> }
            </a>
          </div>
        </nav>

        <!-- Footer Profile -->
        <div class="p-6 border-t border-[#e4e6ea] bg-white">
          <div class="p-4 rounded-[1.5rem] bg-[#f8f9fa] border border-[#e4e6ea] space-y-4 overflow-hidden">
             <div class="flex items-center gap-3" [class.justify-center]="sidebarCollapsed()">
               <div class="w-10 h-10 rounded-full bg-white border border-[#e4e6ea] flex-shrink-0 flex items-center justify-center text-primary font-black text-xs shadow-sm">
                 {{ getUserInitials() }}
               </div>
               @if (!sidebarCollapsed()) {
                 <div class="min-w-0 animate-fade-in">
                   <div class="text-xs font-black text-[#0D1B2A] truncate leading-none mb-1">{{ supplierName() }}</div>
                   <div class="text-[9px] font-bold text-emerald-600 uppercase tracking-widest whitespace-nowrap text-ellipsis overflow-hidden">Marchand Certifié</div>
                 </div>
               }
             </div>
             <button (click)="logout()" class="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-all text-[9px] font-black uppercase tracking-widest border border-transparent hover:border-red-100" [class.px-0]="sidebarCollapsed()" [title]="sidebarCollapsed() ? 'Quitter' : ''">
               <mat-icon class="scale-75 flex-shrink-0">logout</mat-icon> 
               @if (!sidebarCollapsed()) { <span class="animate-fade-in">Quitter</span> }
             </button>
          </div>
        </div>
      </aside>

      <!-- MAIN AREA -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header class="h-20 px-8 bg-white/80 backdrop-blur-md border-b border-[#e4e6ea] flex items-center justify-between sticky top-0 z-50">
          <div class="flex items-center gap-6">
            <button (click)="sidebarCollapsed.set(!sidebarCollapsed())" class="w-10 h-10 rounded-xl flex items-center justify-center text-[#5a5e72] hover:bg-[#f0f2f5] transition-all">
              <mat-icon>{{sidebarCollapsed() ? 'menu' : 'menu_open'}}</mat-icon>
            </button>
            <div class="hidden sm:block">
               <h1 class="text-lg font-black text-[#0D1B2A] tracking-tight">{{ pageTitle() }}</h1>
               <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-bold text-[#9699a8]">O'CHAP Afrique</span>
                  <span class="w-1 h-1 rounded-full bg-[#e4e6ea]"></span>
                  <span class="text-[10px] font-bold text-primary italic">{{ currentTime() }}</span>
               </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="hidden md:flex items-center gap-3 bg-[#f8f9fa] border border-[#e4e6ea] rounded-full pl-4 pr-1 py-1 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <mat-icon class="scale-75 text-[#9699a8]">search</mat-icon>
              <input type="text" placeholder="Commandes, produits..." class="bg-transparent border-none outline-none text-[11px] font-bold w-40 text-[#0D1B2A]">
              <div class="bg-white px-2 py-1 rounded-full border border-[#e4e6ea] text-[9px] font-black text-[#9699a8] mr-1">⌘K</div>
            </div>

            <button (click)="showNotifications.set(!showNotifications())" class="w-10 h-10 rounded-xl flex items-center justify-center text-[#5a5e72] hover:bg-[#f8f9fa] hover:text-primary transition-all relative group border border-transparent hover:border-[#e4e6ea]" title="Notifications">
              <mat-icon class="scale-90">notifications</mat-icon>
              @if (unreadNotesCount() > 0) {
                <span class="absolute top-2.5 right-3 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-white animate-pulse"></span>
              }

              @if (showNotifications()) {
                <div class="absolute top-full right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-[#e4e6ea] overflow-hidden animate-fade-in text-left">
                  <div class="p-6 border-b border-[#e4e6ea] flex items-center justify-between bg-[#fcfcfd]">
                    <span class="text-[10px] font-black text-[#0D1B2A] uppercase tracking-widest italic">Notifications</span>
                    <span class="text-[10px] font-bold text-primary">{{ unreadNotesCount() }} Nouvelles</span>
                  </div>
                  <div class="max-h-96 overflow-y-auto no-scrollbar">
                    @for (note of dataService.notifications$(); track note.id) {
                      <div class="p-5 hover:bg-[#fafafa] border-b border-[#f0f2f5] transition-colors cursor-pointer" [class.bg-blue-50/50]="!note.read" (click)="dataService.markNotificationRead(note.id)">
                        <div class="flex gap-4">
                          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" 
                               [class]="note.type === 'order' ? 'bg-[#e8f4fd] text-[#0984e3]' : 'bg-[#fef9e6] text-[#f39c12]'">
                            <mat-icon class="scale-75 text-sm">{{ note.type === 'order' ? 'shopping_bag' : 'warehouse' }}</mat-icon>
                          </div>
                          <div class="min-w-0">
                            <p class="text-[10px] font-black text-[#0D1B2A] leading-tight mb-1 truncate">{{ note.title }}</p>
                            <p class="text-[9px] font-medium text-[#9699a8] leading-relaxed line-clamp-2">{{ note.message }}</p>
                          </div>
                        </div>
                      </div>
                    } @empty {
                      <div class="p-10 text-center opacity-30">
                        <mat-icon class="scale-125 mb-4">notifications_off</mat-icon>
                        <p class="text-[10px] font-black uppercase tracking-widest">Aucune notification</p>
                      </div>
                    }
                  </div>
                  <a routerLink="/supplier/notifications" (click)="showNotifications.set(false)" class="block w-full p-4 text-center text-[9px] font-black text-[#0D1B2A] uppercase tracking-widest hover:bg-[#f0f2f5] transition-all border-t border-[#e4e6ea]">
                    Voir tout le flux
                  </a>
                </div>
              }
            </button>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto no-scrollbar p-8 lg:p-10">
          <router-outlet />
        </div>
      </main>

    </div>
  `,
  styles: [`
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 1.2rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #5a5e72;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
      border: 1px solid transparent;
    }
    .nav-item:hover {
      background: #f8f9fa;
      color: #0D1B2A;
      border-color: #e4e6ea;
      transform: translateX(4px);
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class SupplierLayoutComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  public dataService = inject(DataService);
  private router = inject(Router);

  mobileMenuOpen = signal(false);
  sidebarCollapsed = signal(false);
  showNotifications = signal(false);

  unreadNotesCount = computed(() => {
    return this.dataService.notifications$().filter(n => !n.read).length;
  });

  supplierName = computed(() => {
    const profile = this.authService.profile$() as Record<string, unknown>;
    return (profile?.['displayName'] as string) || (this.authService.user$()?.email?.split('@')[0]) || 'Marchand';
  });
  pageTitle = signal('Tableau de bord');
  currentTime = signal('');

  private clockInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.updateTime();
    this.clockInterval = setInterval(() => this.updateTime(), 1000);

    // Listen for route changes to update title
    this.router.events.subscribe(() => {
      this.updatePageTitle();
    });
    this.updatePageTitle();

    // Start notification watcher
    const user = this.authService.user$();
    if (user) {
      this.dataService.watchNotifications(user.uid);
    }

    // Update supplier unread count
    this.dataService.notifications$(); // Trigger compute
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  updateTime() {
    this.currentTime.set(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  updatePageTitle() {
    const url = this.router.url;
    if (url.includes('/dashboard')) this.pageTitle.set('Tableau de bord');
    else if (url.includes('/orders')) this.pageTitle.set('Commandes');
    else if (url.includes('/inventory')) this.pageTitle.set('Gestion du stock');
    else if (url.includes('/tracking')) this.pageTitle.set('Suivi livraisons');
    else if (url.includes('/products')) this.pageTitle.set('Catalogue produits');
    else if (url.includes('/settings')) this.pageTitle.set('Paramètres');
  }

  getUserInitials() {
    const name = this.supplierName();
    if (!name) return 'S';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
