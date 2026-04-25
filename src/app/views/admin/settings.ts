import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div>
        <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Paramètres Globaux</h2>
        <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Configuration haute sécurité de l'écosystème O'CHAP</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- System Status -->
        <div class="bg-white rounded-[2rem] border border-[#e4e6ea] shadow-sm p-8">
           <h3 class="text-xs font-black text-[#0D1B2A] uppercase tracking-widest mb-6 flex items-center gap-2">
             <mat-icon class="scale-75 text-emerald-500">check_circle</mat-icon>
             État du Système
           </h3>
           <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b border-surface-2">
                <span class="text-[10px] font-bold text-muted uppercase">Base de données</span>
                <span class="text-[10px] font-black text-emerald-600">OPÉRATIONNEL</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-surface-2">
                <span class="text-[10px] font-bold text-muted uppercase">Authentification</span>
                <span class="text-[10px] font-black text-emerald-600">OPÉRATIONNEL</span>
              </div>
           </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-white rounded-[2rem] border border-red-100 shadow-sm p-8">
           <h3 class="text-xs font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
             <mat-icon class="scale-75">warning</mat-icon>
             Zone de Danger
           </h3>
           <p class="text-[11px] text-muted mb-6 font-medium">Réinitialisez l'ensemble de la base de données O'CHAP. Cette action supprimera tous les produits, commandes et utilisateurs (sauf vous).</p>
           
           <button 
             (click)="resetDatabase()"
             [disabled]="loading()"
             class="w-full py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">
              @if (loading()) {
                <mat-icon class="animate-spin scale-75">sync</mat-icon>
                TRAITEMENT...
              } @else {
                <mat-icon class="scale-75">restart_alt</mat-icon>
                RÉINITIALISER LA BASE DE DONNÉES
              }
           </button>
        </div>
      </div>
    </div>
  `
})
export class AdminSettings {
  private dataService = inject(DataService);
  loading = signal(false);

  async resetDatabase() {
    if (confirm('ATTENTION : Cette action supprimera toutes les données de l\'application (Produits, Commandes, Utilisateurs). Êtes-vous ABSOLUMENT sûr ?')) {
      const confirmation = prompt('Tapez "RESET" pour confirmer la suppression définitive :');
      if (confirmation === 'RESET') {
        this.loading.set(true);
        try {
          const success = await this.dataService.clearAllData();
          if (success) {
            alert('Base de données réinitialisée avec succès.');
          }
        } catch (error: unknown) {
          const err = error as { message?: string };
          alert('Erreur lors de la réinitialisation : ' + err.message);
        } finally {
          this.loading.set(false);
        }
      }
    }
  }
}
