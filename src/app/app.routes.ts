import { Routes } from '@angular/router';
import { DashboardComponent }  from './dashboard/dashboard.component';
import { AllTasksComponent }   from './all-tasks/all-tasks.component';
import { CalendarComponent }   from './calendar/calendar.component';
import { BoardViewComponent }  from './board-view/board-view.component';
import { TodayComponent }      from './today/today.component';
import { UpcomingComponent }   from './upcoming/upcoming.component';
import { authGuard }           from './core/guards/auth.guard';
import { publicOnlyGuard }     from './core/guards/public-only.guard';

export const routes: Routes = [

  // ── Public-only auth routes ────────────────────────────────────────────
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./features/auth/signup/signup.component')
      .then(m => m.SignupComponent)
  },

  // ── Protected app routes ───────────────────────────────────────────────
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '',              redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',     component: DashboardComponent },
      { path: 'all-tasks',     component: AllTasksComponent  },
      { path: 'calendar',      component: CalendarComponent  },
      { path: 'board-view',    component: BoardViewComponent },
      { path: 'today',         component: TodayComponent     },
      { path: 'upcoming',      component: UpcomingComponent  },
      {
        path: 'category/:id',
        loadComponent: () => import('./features/category-page/category-page.component')
          .then(m => m.CategoryPageComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories-page/categories-page.component')
          .then(m => m.CategoriesPageComponent)
      },
    ]
  },

];
