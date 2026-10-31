import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, filter, map, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Hero } from '../../../../core/models/hero.model';
import { HeroService } from '../../../../core/services/hero.service';

@Component({
  selector: 'app-hero-detail-page',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './hero-detail-page.component.html',
  styleUrl: './hero-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroDetailPageComponent {
  private readonly _route = inject(ActivatedRoute);
  private readonly _heroService = inject(HeroService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hero = signal<Hero | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  constructor() {
    this._route.paramMap.pipe(
      map((params) => params.get('id')),
      filter((id): id is string => id !== null),
      tap(() => {
        this.isLoading.set(true);
        this.hasError.set(false);
      }),
      switchMap((id) => this._heroService.getHeroById(id).pipe(
        tap((hero) => this.hero.set(hero)),
        catchError(() => {
          this.hero.set(null);
          this.hasError.set(true);
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )),
      takeUntilDestroyed(this._destroyRef)
    ).subscribe();
  }
}
