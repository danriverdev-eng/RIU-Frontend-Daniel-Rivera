import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, map, merge, startWith, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Hero } from '../../../../core/models/hero.model';
import { HeroService } from '../../../../core/services/hero.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-hero-list-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './hero-list-page.component.html',
  styleUrls: ['./hero-list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroListPageComponent implements AfterViewInit {
  private readonly _heroService = inject(HeroService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _dialog = inject(MatDialog);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _refreshSearch = new Subject<void>();
  private _createdHeroId: string | null = null;

  readonly searchControl = new FormControl('');
  readonly isLoading = signal(false);
  readonly hasSearchError = signal(false);
  readonly displayedColumns: string[] = ['name', 'realName', 'universe', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<Hero>([]);
  private readonly _results = signal<readonly Hero[]>([]);
  private readonly _pageIndex = signal(0);
  private readonly _pageSize = signal(5);
  readonly resultCount = computed(() => this._results().length);
  readonly mobileHeroes = computed(() => {
    const start = this._pageIndex() * this._pageSize();
    return this._results().slice(start, start + this._pageSize());
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    const navigationState: unknown = this._router.getCurrentNavigation()?.extras.state;
    this._createdHeroId = getCreatedHeroId(navigationState);

    merge(
      this.searchControl.valueChanges.pipe(
        map((term) => (term ?? '').trim()),
        debounceTime(300),
        distinctUntilChanged((previous, current) => previous.toLocaleLowerCase() === current.toLocaleLowerCase())
      ),
      this._refreshSearch.pipe(map(() => (this.searchControl.value ?? '').trim()))
    ).pipe(
      startWith((this.searchControl.value ?? '').trim()),
      switchMap((term) => {
        this.isLoading.set(true);
        this.hasSearchError.set(false);

        return this._heroService.searchHeroesByName(term).pipe(
        tap((heroes) => {
          this.isLoading.set(false);
          this._applyResults(heroes);
        }),
        catchError(() => {
          this.isLoading.set(false);
          this.hasSearchError.set(true);
          this._applyResults([]);
          return EMPTY;
        })
      );
      }),
      takeUntilDestroyed(this._destroyRef)
    ).subscribe();
  }

  ngAfterViewInit(): void {
    this.paginator.pageSize = 5;
    this.paginator.pageIndex = this._pageIndex();
    this.dataSource.paginator = this.paginator;
    this._pageSize.set(this.paginator.pageSize);
  }

  onPageChange(pageIndex: number, pageSize: number): void {
    this._pageIndex.set(pageIndex);
    this._pageSize.set(pageSize);
  }

  retrySearch(): void {
    this._refreshSearch.next();
  }

  private _applyResults(heroes: Hero[]): void {
    const createdHeroIndex = this._createdHeroId
      ? heroes.findIndex((hero) => hero.id === this._createdHeroId)
      : -1;
    const pageIndex = createdHeroIndex >= 0
      ? Math.floor(createdHeroIndex / this._pageSize())
      : 0;

    if (createdHeroIndex >= 0) {
      this._createdHeroId = null;
    }

    this._results.set(heroes);
    this._pageIndex.set(pageIndex);
    if (this.paginator) {
      this.paginator.pageIndex = pageIndex;
    }
    this.dataSource.data = heroes;
  }

  onAddHero(): void {
    this._router.navigate(['/heroes/new']);
  }

  onViewHero(hero: Hero): void {
    this._router.navigate(['/heroes', hero.id]);
  }

  onEditHero(hero: Hero): void {
    this._router.navigate(['/heroes/edit', hero.id]);
  }

  onDeleteHero(hero: Hero): void {
    const dialogRef = this._dialog.open(ConfirmDialogComponent, {
      panelClass: 'brand-confirm-dialog',
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que deseas eliminar al superhéroe "${hero.name}"?`
      }
    });

    dialogRef.afterClosed().pipe(
      switchMap((confirmed) => confirmed
        ? this._heroService.deleteHero(hero.id).pipe(
          tap(() => {
            this._showNotification(`El héroe ${hero.name} fue eliminado correctamente.`);
            this._refreshSearch.next();
          }),
          catchError(() => {
            this._showNotification('Error al eliminar el héroe.');
            return EMPTY;
          })
        )
        : EMPTY
      ),
      takeUntilDestroyed(this._destroyRef)
    ).subscribe();
  }

  private _showNotification(message: string): void {
    this._snackBar.open(message, 'Cerrar', { duration: 3000 });
  }
}

function getCreatedHeroId(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('createdHeroId' in state)) {
    return null;
  }

  const heroId = state.createdHeroId;
  return typeof heroId === 'string' ? heroId : null;
}
