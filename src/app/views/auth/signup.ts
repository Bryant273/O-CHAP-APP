import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-signup',
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
            Propulsez votre <br/>
            <span class="text-primary">shopping ici.</span>
          </h1>
          
          <p class="text-white/80 text-base lg:text-lg font-medium mb-12 max-w-md">
            Simplifiez vos achats avec O'CHAP. Accédez aux meilleures marques et profitez d'avantages exclusifs dès aujourd'hui.
          </p>
          
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm shrink-0">
                <mat-icon class="text-primary text-sm">rocket_launch</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-1">Accès Anticipé</h3>
                <p class="text-[11px] text-white/70 font-bold">Soyez le premier informé des nouvelles collections et promos.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm shrink-0">
                <mat-icon class="text-primary text-sm">stars</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-1">Programme Fidélité</h3>
                <p class="text-[11px] text-white/70 font-bold">Cumulez des points à chaque achat et profitez de réductions.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 backdrop-blur-sm shrink-0">
                <mat-icon class="text-primary text-sm">card_giftcard</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-black text-white uppercase tracking-wider mb-1">Cadeaux Exclusifs</h3>
                <p class="text-[11px] text-white/70 font-bold">Des surprises attendent nos nouveaux membres.</p>
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

        <div class="w-full max-w-sm mx-auto flex flex-col gap-6 py-6 lg:py-12">
          <div class="text-center md:text-left">
            <div class="oc-brand !justify-center md:!justify-start mb-6 lg:hidden">
              O'<span>Chap</span>
            </div>
            <h2 class="text-3xl font-black text-ink tracking-tighter mb-2">Inscription.</h2>
            <p class="text-muted text-xs font-medium">Rejoignez l'élite O'Chap.</p>
          </div>

          <!-- Segment Control -->
          <div class="bg-surface-3 p-1 rounded-xl flex items-center mb-1">
            <button routerLink="/auth/login" class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-muted hover:text-ink transition-all">Connexion</button>
            <button class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white shadow-sm text-ink transition-all">Inscription</button>
          </div>

          <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1.5">
              <span class="text-[9px] font-black uppercase text-muted tracking-[0.15em] ml-1">Type de compte</span>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  (click)="signupForm.get('role')?.setValue('client')"
                  [class.bg-primary]="signupForm.get('role')?.value === 'client'"
                  [class.text-white]="signupForm.get('role')?.value === 'client'"
                  [class.bg-white]="signupForm.get('role')?.value !== 'client'"
                  class="py-2.5 rounded-xl border border-border text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                >
                  Client
                </button>
                <button 
                  type="button"
                  (click)="signupForm.get('role')?.setValue('supplier')"
                  [class.bg-primary]="signupForm.get('role')?.value === 'supplier'"
                  [class.text-white]="signupForm.get('role')?.value === 'supplier'"
                  [class.bg-white]="signupForm.get('role')?.value !== 'supplier'"
                  class="py-2.5 rounded-xl border border-border text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                >
                  Fournisseur
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="name" class="text-[9px] font-black uppercase text-muted tracking-[0.15em] ml-1">Nom Complet</label>
              <div class="relative group">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-muted scale-75 group-focus-within:text-primary transition-colors">person_outline</mat-icon>
                <input 
                  id="name"
                  type="text" 
                  formControlName="name"
                  class="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-xs font-medium"
                  placeholder="Jean Dupont"
                >
              </div>
            </div>

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
              @if (signupForm.get('email')?.touched && signupForm.get('email')?.errors?.['email']) {
                <p class="text-[9px] text-red-500 font-bold ml-1 tracking-wide">L'email n'est pas valide</p>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="password" class="text-[9px] font-black uppercase text-muted tracking-[0.15em] ml-1">Mot de passe</label>
                <div class="relative group">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-muted scale-75 group-focus-within:text-primary transition-colors">lock_outline</mat-icon>
                  <input 
                    id="password"
                    type="password" 
                    formControlName="password"
                    class="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-xs font-medium"
                    placeholder="••••••••"
                  >
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="confirmPassword" class="text-[9px] font-black uppercase text-muted tracking-[0.15em] ml-1">Confirmer</label>
                <div class="relative group">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-muted scale-75 group-focus-within:text-primary transition-colors">lock_outline</mat-icon>
                  <input 
                    id="confirmPassword" 
                    type="password" 
                    formControlName="confirmPassword"
                    class="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all text-xs font-medium"
                    placeholder="••••••••"
                  >
                </div>
              </div>
            </div>

            @if (signupForm.errors?.['passwordMismatch'] && signupForm.get('confirmPassword')?.touched) {
              <p class="text-[9px] text-red-500 font-bold ml-1 tracking-wide">Les mots de passe ne correspondent pas</p>
            }

            @if (errorMessage()) {
              <div class="p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-shake">
                <mat-icon class="text-red-500 scale-75">error_outline</mat-icon>
                <span class="text-[9px] text-red-600 font-bold uppercase tracking-wide">{{ errorMessage() }}</span>
              </div>
            }

            <button 
              type="submit" 
              [disabled]="signupForm.invalid || loading()"
              class="w-full bg-navy text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-navy-light transition-all shadow-lg shadow-navy/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-1"
            >
              @if (loading()) {
                <mat-icon class="animate-spin scale-75">sync</mat-icon>
              } @else {
                Créer mon compte
                <mat-icon class="scale-50">arrow_forward</mat-icon>
              }
            </button>
          </form>

          <div class="relative py-4 mt-2">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-surface-3"></div></div>
            <div class="relative flex justify-center text-[8px] uppercase font-black text-muted tracking-[0.3em] bg-surface-2 px-4">Ou s'inscrire avec</div>
          </div>

          <!-- Google Signup - Social Integration -->
          <button 
            type="button" 
            (click)="loginWithGoogle()"
            class="w-full bg-white border border-border hover:border-primary/50 py-3 rounded-xl flex items-center justify-center gap-4 transition-all text-[11px] font-black text-ink uppercase tracking-widest active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-primary/5 group mt-2"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" class="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google">
            S'inscrire avec Google
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
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  signupForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    role: ['client', Validators.required]
  }, { validators: this.passwordMatchValidator });

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword) return null;
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  async loginWithGoogle() {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (error: unknown) {
      console.error('Login failed', error);
      this.errorMessage.set('La connexion avec Google a échoué.');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    if (this.signupForm.invalid) return;
    
    this.loading.set(true);
    this.errorMessage.set(null);
    
    try {
      const { email, password, name, role } = this.signupForm.getRawValue();
      await this.authService.signupWithEmail(email!, password!, name!, role as 'client' | 'supplier');
      this.router.navigate(['/']);
    } catch (error: unknown) {
      const err = error as { code?: string };
      const code = err.code || '';
      console.warn('Signup error:', code, error);
      
      switch (code) {
        case 'auth/email-already-in-use':
          this.errorMessage.set('Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.');
          break;
        case 'auth/weak-password':
          this.errorMessage.set('Le mot de passe est trop faible. Utilisez au moins 6 caractères.');
          break;
        case 'auth/invalid-email':
          this.errorMessage.set('L\'adresse email n\'est pas valide.');
          break;
        case 'auth/operation-not-allowed':
          this.errorMessage.set('L\'inscription par email n\'est pas activée.');
          break;
        default:
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
