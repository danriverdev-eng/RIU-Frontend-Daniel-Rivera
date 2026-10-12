import { AfterViewInit, Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
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
  styleUrls: ['./hero-list-page.component.scss']
})
export class HeroListPageComponent implements AfterViewInit {
  private readonly heroService = inject(HeroService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly refreshSearch = new Subject<void>();
  private createdHeroId: string | null = null;

  readonly searchControl = new FormControl('');
  readonly isLoading = signal(false);
  readonly hasSearchError = signal(false);
  readonly displayedColumns: string[] = ['name', 'realName', 'universe', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<Hero>([]);
  private readonly results = signal<readonly Hero[]>([]);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(5);
  readonly resultCount = computed(() => this.results().length);
  readonly mobileHeroes = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.results().slice(start, start + this.pageSize());
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    const navigationState: unknown = this.router.getCurrentNavigation()?.extras.state;
    this.createdHeroId = getCreatedHeroId(navigationState);

    merge(
      this.searchControl.valueChanges.pipe(
        map((term) => (term ?? '').trim()),
        debounceTime(300),
        distinctUntilChanged((previous, current) => previous.toLocaleLowerCase() === current.toLocaleLowerCase())
      ),
      this.refreshSearch.pipe(map(() => (this.searchControl.value ?? '').trim()))
    ).pipe(
      startWith((this.searchControl.value ?? '').trim()),
      switchMap((term) => {
        this.isLoading.set(true);
        this.hasSearchError.set(false);

        return this.heroService.searchHeroesByName(term).pipe(
        tap((heroes) => {
          this.isLoading.set(false);
          this.applyResults(heroes);
        }),
        catchError(() => {
          this.isLoading.set(false);
          this.hasSearchError.set(true);
          this.applyResults([]);
          return EMPTY;
        })
      );
      }),
      takeUntilDestroyed()
    ).subscribe();
  }

  ngAfterViewInit(): void {
    this.paginator.pageSize = 5;
    this.paginator.pageIndex = this.pageIndex();
    this.dataSource.paginator = this.paginator;
    this.pageSize.set(this.paginator.pageSize);
  }

  onPageChange(pageIndex: number, pageSize: number): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
  }

  retrySearch(): void {
    this.refreshSearch.next();
  }

  private applyResults(heroes: Hero[]): void {
    const createdHeroIndex = this.createdHeroId
      ? heroes.findIndex((hero) => hero.id === this.createdHeroId)
      : -1;
    const pageIndex = createdHeroIndex >= 0
      ? Math.floor(createdHeroIndex / this.pageSize())
      : 0;

    if (createdHeroIndex >= 0) {
      this.createdHeroId = null;
    }

    this.results.set(heroes);
    this.pageIndex.set(pageIndex);
    if (this.paginator) {
      this.paginator.pageIndex = pageIndex;
    }
    this.dataSource.data = heroes;
  }

  onAddHero(): void {
    this.router.navigate(['/heroes/new']);
  }

  onEditHero(hero: Hero): void {
    this.router.navigate(['/heroes/edit', hero.id]);
  }

  onDeleteHero(hero: Hero): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'brand-confirm-dialog',
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Estás seguro de que deseas eliminar al superhéroe "${hero.name}"?`
      }
    });

    dialogRef.afterClosed().pipe(
      switchMap((confirmed) => confirmed
        ? this.heroService.deleteHero(hero.id).pipe(
          tap(() => {
            this.showNotification(`El héroe ${hero.name} fue eliminado correctamente.`);
            this.refreshSearch.next();
          }),
          catchError(() => {
            this.showNotification('Error al eliminar el héroe.');
            return EMPTY;
          })
        )
        : EMPTY
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }
}

function getCreatedHeroId(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('createdHeroId' in state)) {
    return null;
  }

  const heroId = state.createdHeroId;
  return typeof heroId === 'string' ? heroId : null;
}
