import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'heroes', pathMatch: 'full' },
  {
    path: 'heroes',
    loadComponent: () =>
      import('./features/heroes/pages/hero-list-page/hero-list-page.component').then(
        (m) => m.HeroListPageComponent
      )
  },
  {
    path: 'heroes/new',
    loadComponent: () =>
      import('./features/heroes/pages/hero-form-page/hero-form-page.component').then(
        (m) => m.HeroFormPageComponent
      )
  },
  {
    path: 'heroes/edit/:id',
    loadComponent: () =>
      import('./features/heroes/pages/hero-form-page/hero-form-page.component').then(
        (m) => m.HeroFormPageComponent
      )
  },
  {
    path: 'heroes/:id',
    loadComponent: () =>
      import('./features/heroes/pages/hero-detail-page/hero-detail-page.component').then(
        (m) => m.HeroDetailPageComponent
      )
  },
  { path: '**', redirectTo: 'heroes' }
];
