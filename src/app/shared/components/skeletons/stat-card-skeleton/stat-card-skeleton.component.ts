import { Component } from '@angular/core';
import { SkeletonBoxComponent } from '../../skeleton-box/skeleton-box.component';

@Component({
  selector: 'app-stat-card-skeleton',
  imports: [SkeletonBoxComponent],
  template: `
    <div class="skeleton-stat-card">
      <div class="card-top">
        <app-skeleton-box width="60px" height="11px" />
        <app-skeleton-box width="32px" height="32px" borderRadius="50%" />
      </div>
      <app-skeleton-box width="60px" height="28px" borderRadius="6px" />
      <app-skeleton-box width="50px" height="18px" borderRadius="999px" />
    </div>
  `,
  styles: [`
    :host { display: block; }

    .skeleton-stat-card {
      background: white;
      border: 1px solid #E4E4E7;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class StatCardSkeletonComponent {}
