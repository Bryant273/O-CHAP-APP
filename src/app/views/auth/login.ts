import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen flex flex-col md:flex-row font-sans overflow-hidden">
      <!-- Left side: Brand Showcase -->
      <div class="hidden md:flex md:w-[45%] bg-navy relative items-center justify-center p-12 lg:p-20 overflow-hidden">
        <div class="absolute inset-0 z-0 overflow-hidden">
          <div class="absolute top-0 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
          <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[150px] translate-x-1/2 translate-y-1/2 opacity-10"></div>
        </div>
        
        <div class="relative z-10 max-w-lg">
          <div class="oc-brand !text-white text-3xl mb-12">O'<span>CHAP</span></div>
          
          <h1 class="text-4xl lg:text-6xl font-black text-white leading-[1.05] tracking-tighter mb-8 drop-shadow-sm">
            La gestion de demain, <br/>
            <span class="text-primary">disponible aujourd'hui.</span>
          </h1>
          
          <p class="text-muted text-base lg:text-lg font-medium mb-12 max-w-md">
            Rejoignez l'écosystème O'CHAP et transformez votre quotidien avec nos produits premiums et un service exceptionnel.
          </p>
          
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm shrink-0">
                <mat-icon class="text-primary text-sm">verified_user</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-1">Paiement Sécurisé</h3>
                <p class="text-[11px] text-muted font-bold">Vos transactions sont cryptées et protégées à 100%.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm shrink-0">
                <mat-icon class="text-primary text-sm">local_shipping</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-1">Livraison Rapide</h3>
                <p class="text-[11px] text-muted font-bold">Partout à Abidjan et dans toute la Côte d'Ivoire en 48h chrono.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm shrink-0">
                <mat-icon class="text-primary text-sm">support_agent</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-1">Support Local</h3>
                <p class="text-[11px] text-muted font-bold">Une équipe à Abidjan à votre écoute 24/7 pour un service de proximité.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Auth Form -->
      <div class="flex-1 bg-surface-2 flex flex-col p-6 md:p-12 lg:p-20 relative">
        <div class="mb-auto">
          <button routerLink="/" class="flex items-center gap-2 text-muted hover:text-ink transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer group">
            <mat-icon class="scale-75 group-hover:-translate-x-1 transition-transform">arrow_back</mat-icon>
            Retour à l'accueil
          </button>
        </div>

        <div class="w-full max-w-sm mx-auto flex flex-col gap-6 py-12">
          <div class="text-center md:text-left">
            <div class="oc-brand !justify-center md:!justify-start mb-10 group lg:hidden">
              O'<span class="text-primary">Chap</span>
            </div>
            <h2 class="text-3xl font-black text-ink tracking-tight mb-2">Heureux de vous revoir.</h2>
            <p class="text-muted text-xs font-semibold pl-1 mb-4">Le prestige de la gestion, à votre portée.</p>

          </div>

          <!-- Segment Control (Mocked toggle for visuals) -->
          <div class="bg-surface-3 p-1 rounded-xl flex items-center mb-1">
            <button class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white shadow-sm text-ink transition-all">Connexion</button>
            <button routerLink="/auth/signup" class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-muted hover:text-ink transition-all">Inscription</button>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1.5">
              <label for="email" class="text-[9px] font-black uppercase text-muted tracking-[0.15em] ml-1">Email</label>
              <div class="relative group">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-muted scale-75 group-focus-within:text-primary transition-colors">mail_outline</mat-icon>
                <input 
                  id="email"
                  type="email" 
                  formControlName="email"
                  class="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-xs font-medium"
                  placeholder="votre@email.com"
                >
              </div>
              @if (loginForm.get('email')?.touched && loginForm.get('email')?.errors?.['email']) {
                <p class="text-[9px] text-red-500 font-bold ml-1 tracking-wide">L'email n'est pas valide</p>
              }
            </div>

            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between ml-1 pr-1">
                <label for="password" class="text-[9px] font-black uppercase text-muted tracking-[0.15em]">Mot de passe</label>
                <a href="javascript:void(0)" class="text-[9px] font-black text-primary uppercase tracking-wider hover:underline">Oublié ?</a>
              </div>
              <div class="relative group">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-muted scale-75 group-focus-within:text-primary transition-colors">lock_outline</mat-icon>
                <input 
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'" 
                  formControlName="password"
                  class="w-full pl-12 pr-12 py-2.5 rounded-xl bg-white border border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-xs font-medium"
                  placeholder="••••••••"
                >
                <button 
                  type="button" 
                  (click)="togglePassword()"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
                >
                  <mat-icon class="scale-75">{{ showPassword() ? 'visibility' : 'visibility_off' }}</mat-icon>
                </button>
              </div>
            </div>

            @if (errorMessage()) {
              <div class="p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-shake">
                <mat-icon class="text-red-500 scale-75">error_outline</mat-icon>
                <span class="text-[9px] text-red-600 font-bold uppercase tracking-wide">{{ errorMessage() }}</span>
              </div>
            }

            <button 
              type="submit" 
              [disabled]="loginForm.invalid || loading()"
              class="w-full bg-navy text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-navy-light transition-all shadow-lg shadow-navy/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-1"
            >
              @if (loading()) {
                <mat-icon class="animate-spin scale-75">sync</mat-icon>
              } @else {
                Se connecter
                <mat-icon class="scale-50">arrow_forward</mat-icon>
              }
            </button>
          </form>

          <div class="relative py-4 mt-2">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-surface-3"></div></div>
            <div class="relative flex justify-center text-[8px] uppercase font-black text-muted tracking-[0.3em] bg-surface-2 px-4">Ou continuer avec</div>
          </div>

          <!-- Google Login - Social Integration -->
          <button 
            type="button" 
            (click)="loginWithGoogle()"
            class="w-full bg-white border border-border hover:border-primary/50 py-3 rounded-xl flex items-center justify-center gap-4 transition-all text-[11px] font-black text-ink uppercase tracking-widest active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-primary/5 group mt-2"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" class="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google">
            Continuer avec Google
          </button>
        </div>

        <div class="mt-auto text-center">
          <p class="text-[11px] text-muted font-medium">
            En continuant, vous acceptez nos 
            <a href="javascript:void(0)" class="text-ink font-bold hover:text-primary underline underline-offset-4 transition-colors">Conditions</a> 
            et notre 
            <a href="javascript:void(0)" class="text-ink font-bold hover:text-primary underline underline-offset-4 transition-colors">Confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.4s ease-out; }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public location = inject(Location);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;
    
    this.loading.set(true);
    this.errorMessage.set(null);
    
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.authService.loginWithEmail(email!, password!);
      // Give it a tiny bit to load the profile signal
      setTimeout(() => this.redirectByRole(), 500);
    } catch (error: unknown) {
      const err = error as { code?: string };
      this.errorMessage.set(this.handleAuthError(err.code || ''));
    } finally {
      this.loading.set(false);
    }
  }

  async loginWithGoogle() {
    this.loading.set(true);
    try {
      await this.authService.loginWithGoogle();
      setTimeout(() => this.redirectByRole(), 500);
    } catch {
      this.errorMessage.set('La connexion avec Google a échoué.');
    } finally {
      this.loading.set(false);
    }
  }

  private redirectByRole() {
    const user = this.authService.user$();
    const profile = this.authService.profile$();
    
    // Priority check for the primary admin to ensure they never land on store when they expect ERP
    if (user?.email?.toLowerCase() === 'acherie812@gmail.com') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    const role = profile?.['role'];
    if (role === 'admin' || role === 'manager_erp') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'fournisseur' || role === 'manager_sup' || role === 'supplier') {
      this.router.navigate(['/supplier/dashboard']);
    } else if (role === 'client' || role === 'customer') {
      this.router.navigate(['/profile']);
    } else {
      // Fallback to home if profile not yet loaded, but above admin check handles the primary case
      this.router.navigate(['/']);
    }
  }

  private handleAuthError(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email ou mot de passe incorrect.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives échouées. Veuillez réessayer plus tard.';
      default:
        return 'Une erreur est survenue lors de la connexion.';
    }
  }
}
