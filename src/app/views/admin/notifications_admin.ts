import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div>
        <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Notifications Système</h2>
        <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Diffusion et gestion des alertes globales plateforme</p>
      </div>
      <div class="bg-[#0D1B2A] rounded-[2.5rem] border border-white/5 shadow-2xl p-12 text-center text-primary">
         <mat-icon class="scale-[2] opacity-20 mb-6">dynamic_feed</mat-icon>
         <h3 class="text-sm font-black text-white uppercase tracking-widest">Global Broadcast Center</h3>
      </div>
    </div>
  `
})
export class AdminNotifications {}
