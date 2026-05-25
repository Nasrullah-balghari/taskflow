import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-box',
  imports: [],
  template: `
    <div
      class="skeleton-box"
      [class]="className()"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="borderRadius()"
    ></div>
  `,
  styleUrl: './skeleton-box.component.scss'
})
export class SkeletonBoxComponent {
  width        = input<string>('100%');
  height       = input<string>('14px');
  borderRadius = input<string>('4px');
  className    = input<string>('');
}
