import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-promo',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in">
      <div>
        <h2 class="text-2xl font-black text-[#0D1B2A] tracking-tight">Promotions & Marketing</h2>
        <p class="text-xs text-[#5a5e72] mt-1 font-medium italic">Pilotage des campagnes et offres spéciales O'CHAP</p>
      </div>
      <div class="bg-white rounded-[2.5rem] border border-[#e4e6ea] shadow-sm p-12 text-center">
         <mat-icon class="scale-[2] text-primary opacity-20 mb-6">loyalty</mat-icon>
         <h3 class="text-sm font-black text-[#0D1B2A] uppercase tracking-widest">Campaign Manager</h3>
      </div>
    </div>
  `
})
export class AdminPromo {}
