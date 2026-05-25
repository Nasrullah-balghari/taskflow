import { Component } from '@angular/core';

export interface UpcomingTask {
  id: number;
  title: string;
  desc: string;
  date: string;
  group: 'tomorrow' | 'thisweek' | 'nextweek' | 'later';
  category: string;
  catColor: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

@Component({
  selector: 'app-upcoming',
  imports: [],
  templateUrl: './upcoming.component.html',
  styleUrl: './upcoming.component.scss'
})
export class UpcomingComponent {
  tasks: UpcomingTask[] = [
    {
      id: 1, title: 'Product demo with stakeholders', desc: 'Present Q4 feature updates',
      date: 'Tomorrow, 10:00 AM', group: 'tomorrow', category: 'Work', catColor: '#00B894',
      priority: 'high', completed: false
    },
    {
      id: 2, title: 'Dentist appointment', desc: 'Annual checkup and cleaning',
      date: 'Tomorrow, 3:00 PM', group: 'tomorrow', category: 'Personal', catColor: '#FDCB6E',
      priority: 'medium', completed: false
    },
    {
      id: 3, title: 'Finalize API documentation', desc: 'Cover all new v2 endpoints',
      date: 'Wed, May 14', group: 'thisweek', category: 'Development', catColor: '#3498DB',
      priority: 'high', completed: false
    },
    {
      id: 4, title: 'Weekly team retrospective', desc: 'Review sprint progress and blockers',
      date: 'Thu, May 15', group: 'thisweek', category: 'Work', catColor: '#00B894',
      priority: 'medium', completed: false
    },
    {
      id: 5, title: 'Design system component review', desc: 'Audit components for accessibility',
      date: 'Fri, May 16', group: 'thisweek', category: 'Design', catColor: '#6C63FF',
      priority: 'low', completed: false
    },
    {
      id: 6, title: 'Market research report', desc: 'Competitive analysis for new feature set',
      date: 'Mon, May 19', group: 'nextweek', category: 'Research', catColor: '#9B59B6',
      priority: 'medium', completed: false
    },
    {
      id: 7, title: 'User interview sessions', desc: '5 interviews scheduled with beta users',
      date: 'Tue, May 20', group: 'nextweek', category: 'Research', catColor: '#9B59B6',
      priority: 'high', completed: false
    },
    {
      id: 8, title: 'Quarterly budget review', desc: 'Finance meeting with leadership',
      date: 'May 28', group: 'later', category: 'Internal', catColor: '#F39C12',
      priority: 'medium', completed: false
    },
    {
      id: 9, title: 'Conference talk preparation', desc: 'Prepare slides for AngularConnect',
      date: 'Jun 5', group: 'later', category: 'Development', catColor: '#3498DB',
      priority: 'low', completed: false
    }
  ];

  get tomorrowTasks()  { return this.tasks.filter(t => t.group === 'tomorrow'); }
  get thisWeekTasks()  { return this.tasks.filter(t => t.group === 'thisweek'); }
  get nextWeekTasks()  { return this.tasks.filter(t => t.group === 'nextweek'); }
  get laterTasks()     { return this.tasks.filter(t => t.group === 'later'); }
  get totalCount()     { return this.tasks.length; }
}
