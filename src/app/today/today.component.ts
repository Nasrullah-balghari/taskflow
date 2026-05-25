import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface TodayTask {
  id: number;
  title: string;
  desc: string;
  time: string;
  period: 'morning' | 'afternoon' | 'evening';
  category: string;
  catColor: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

@Component({
  selector: 'app-today',
  imports: [DecimalPipe],
  templateUrl: './today.component.html',
  styleUrl: './today.component.scss'
})
export class TodayComponent {
  today = new Date();

  get dateLabel(): string {
    return this.today.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  tasks: TodayTask[] = [
    {
      id: 1, title: 'Team standup meeting', desc: 'Daily sync with engineering team',
      time: '9:00 AM', period: 'morning', category: 'Work', catColor: '#00B894',
      priority: 'high', completed: false
    },
    {
      id: 2, title: 'Review design mockups', desc: 'Check UI kit updates from design team',
      time: '10:30 AM', period: 'morning', category: 'Design', catColor: '#6C63FF',
      priority: 'medium', completed: true
    },
    {
      id: 3, title: 'Write unit tests for auth module', desc: 'Cover edge cases for login flow',
      time: '11:00 AM', period: 'morning', category: 'Development', catColor: '#3498DB',
      priority: 'high', completed: false
    },
    {
      id: 4, title: 'Lunch with client', desc: 'Discuss Q4 roadmap and priorities',
      time: '1:00 PM', period: 'afternoon', category: 'Work', catColor: '#00B894',
      priority: 'medium', completed: false
    },
    {
      id: 5, title: 'Fix navigation bug on Safari', desc: 'Reported in bug tracker #1042',
      time: '2:30 PM', period: 'afternoon', category: 'Bug Fix', catColor: '#E53E3E',
      priority: 'high', completed: false
    },
    {
      id: 6, title: 'Update project documentation', desc: 'Reflect recent API changes',
      time: '4:00 PM', period: 'afternoon', category: 'Internal', catColor: '#F39C12',
      priority: 'low', completed: true
    },
    {
      id: 7, title: 'Gym session', desc: 'Chest and shoulders',
      time: '6:30 PM', period: 'evening', category: 'Personal', catColor: '#FDCB6E',
      priority: 'low', completed: false
    }
  ];

  get morningTasks()   { return this.tasks.filter(t => t.period === 'morning'); }
  get afternoonTasks() { return this.tasks.filter(t => t.period === 'afternoon'); }
  get eveningTasks()   { return this.tasks.filter(t => t.period === 'evening'); }

  get totalCount()     { return this.tasks.length; }
  get completedCount() { return this.tasks.filter(t => t.completed).length; }
  get remainingCount() { return this.tasks.filter(t => !t.completed).length; }

  toggleTask(task: TodayTask) { task.completed = !task.completed; }
}
