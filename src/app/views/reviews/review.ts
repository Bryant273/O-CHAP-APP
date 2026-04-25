import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { auth, db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto p-8">
      <button (click)="goBack()" class="flex items-center gap-2 text-muted hover:text-primary mb-8 transition-colors">
        <mat-icon>arrow_back</mat-icon>
        Retour aux commandes
      </button>

      <div class="oc-card mb-8">
        <div class="flex gap-6 items-center">
          <div class="w-24 h-24 bg-dash-bg rounded-lg overflow-hidden flex-shrink-0">
             <img [src]="asString(product()?.['imageUrl']) || 'https://picsum.photos/seed/' + product()?.['id'] + '/200'" 
                  class="w-full h-full object-cover" [alt]="product()?.['name']">
          </div>
          <div>
            <div class="oc-stat-label">Évaluer le produit</div>
            <h1 class="text-2xl font-black text-ink">{{product()?.['name']}}</h1>
            <p class="text-muted text-sm">{{product()?.['brand']}} • {{product()?.['category']}}</p>
          </div>
        </div>
      </div>

      <div class="oc-card">
        <form (ngSubmit)="submitReview()" class="flex flex-col gap-6">
          <div class="flex flex-col items-center gap-4 py-8 bg-dash-bg rounded-std border border-dashed border-border mb-8">
            <span class="oc-stat-label">Votre note O'CHAP</span>
            <div class="flex gap-2">
              @for (star of [1,2,3,4,5]; track star) {
                <button type="button" (click)="rating.set(star)" class="transition-all hover:scale-125">
                  <mat-icon [class.text-amber-400]="star <= rating()" 
                           [class.text-muted]="star > rating()" 
                           class="scale-[2]">
                    {{ star <= rating() ? 'star' : 'star_outline' }}
                  </mat-icon>
                </button>
              }
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest text-primary">
              {{ rating() === 0 ? 'Sélectionnez une note' : rating() + '/5 Étoiles' }}
            </p>
          </div>

          <div>
            <label for="review-comment" class="oc-stat-label block mb-2">Votre avis détaillé</label>
            <textarea [(ngModel)]="comment" name="comment" rows="6" id="review-comment"
                      placeholder="Comment s'est passée votre expérience avec ce produit ?"
                      class="w-full bg-dash-bg border border-border rounded-std p-4 text-sm focus:outline-none focus:border-primary font-medium"></textarea>
          </div>

          <button type="submit" [disabled]="!comment.trim() || !rating() || loading()"
                  class="w-full bg-navy text-white py-4 rounded-std font-bold shadow-oc hover:bg-primary transition-all disabled:opacity-50 disabled:grayscale flex justify-center items-center gap-3 uppercase text-[11px] tracking-[0.2em]">
            @if (loading()) {
               <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               Publication...
            } @else {
               Publier mon expérience vérifiée
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  
  productId = signal<string | null>(null);
  orderId = signal<string | null>(null);
  product = signal<Record<string, unknown> | null>(null);
  rating = signal<number>(0);
  comment = '';
  loading = signal(false);

  asString(val: unknown): string { return (val as string) || ''; }

  ngOnInit() {
    this.productId.set(this.route.snapshot.paramMap.get('productId'));
    this.orderId.set(this.route.snapshot.paramMap.get('orderId'));
    
    if (this.productId()) {
      this.loadProduct(this.productId()!);
    }
  }

  async loadProduct(id: string) {
    try {
      const docRef = doc(db, 'products', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        this.product.set({ id: snap.id, ...snap.data() });
      }
    } catch (e) {
      console.error('Erreur chargement produit', e);
    }
  }

  async submitReview() {
    if (!this.comment.trim() || !this.productId() || !this.orderId() || !this.rating()) return;

    this.loading.set(true);
    try {
      await this.dataService.submitReview({
        productId: this.productId()!,
        orderId: this.orderId()!,
        rating: this.rating(),
        comment: this.comment,
        customerName: auth.currentUser?.displayName || 'Client O\'CHAP'
      });
      this.router.navigate(['/orders']);
    } catch (e) {
      console.error('Erreur publication avis', e);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
