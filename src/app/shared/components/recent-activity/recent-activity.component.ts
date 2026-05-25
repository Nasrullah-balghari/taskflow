import { Component, computed, inject } from '@angular/core';
import { TaskService } from '../../../core/services/task.service';
import { CategoryService } from '../../../core/services/category.service';
import { ActivityEvent } from '../../../core/models/task.model';

@Component({
  selector: 'app-recent-activity',
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss',
})
export class RecentActivityComponent {
  private readonly taskService     = inject(TaskService);
  private readonly categoryService = inject(CategoryService);

  readonly recentActivity = computed(() => this.taskService.activityLog().slice(0, 6));

  iconColor(type: ActivityEvent['type']): string {
    const map: Record<ActivityEvent['type'], string> = {
      created:   'purple',
      completed: 'green',
      deleted:   'red',
    };
    return map[type];
  }

  categoryName(id: string | undefined): string {
    return this.categoryService.getCategoryName(id);
  }

  timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (hours < 48) return 'Yesterday';
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
