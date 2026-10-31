import { inject, Injectable, signal } from '@angular/core';
import { defer, Observable, of, throwError } from 'rxjs';
import { Hero, HeroCreateDto, HeroUpdateDto } from '../models/hero.model';
import { LoadingService } from './loading.service';

const minimumMutationLoadingMs = 150;

export type HeroServiceErrorCode = 'not-found';

export class HeroServiceError extends Error {
  constructor(readonly code: HeroServiceErrorCode, message: string) {
    super(message);
    this.name = 'HeroServiceError';
  }
}

const initialHeroes: readonly Hero[] = [
  { id: '1', name: 'Spiderman', realName: 'Peter Parker', powers: ['Sentido arácnido', 'Telarañas'], universe: 'Marvel', status: 'Active' },
  { id: '2', name: 'Superman', realName: 'Clark Kent', powers: ['Vuelo', 'Superfuerza'], universe: 'DC', status: 'Active' },
  { id: '3', name: 'Batman', realName: 'Bruce Wayne', powers: ['Inteligencia', 'Tecnología'], universe: 'DC', status: 'Active' },
  { id: '4', name: 'Manolito el fuerte', realName: 'Manolito Gafotas', powers: ['Fuerza'], universe: 'Local', status: 'Active' },
  { id: '5', name: 'Wonder Woman', realName: 'Diana Prince', powers: ['Superfuerza', 'Vuelo'], universe: 'DC', status: 'Active' },
  { id: '6', name: 'Flash', realName: 'Barry Allen', powers: ['Supervelocidad'], universe: 'DC', status: 'Active' },
  { id: '7', name: 'Thor', realName: 'Thor Odinson', powers: ['Rayo', 'Superfuerza'], universe: 'Marvel', status: 'Active' },
  { id: '8', name: 'Hulk', realName: 'Bruce Banner', powers: ['Fuerza', 'Resistencia'], universe: 'Marvel', status: 'Active' },
  { id: '9', name: 'Black Panther', realName: 'T’Challa', powers: ['Agilidad', 'Tecnología'], universe: 'Marvel', status: 'Active' },
  { id: '10', name: 'Green Lantern', realName: 'Hal Jordan', powers: ['Anillo de poder'], universe: 'DC', status: 'Active' }
];

@Injectable({ providedIn: 'root' })
export class HeroService {
  private readonly _loadingService = inject(LoadingService);
  private readonly _heroes = signal<readonly Hero[]>(freezeHeroes(initialHeroes));
  readonly heroes = this._heroes.asReadonly();

  getHeroes(): Observable<Hero[]> {
    return this._loadingService.track(defer(() => of(this._heroes().map(cloneHero))));
  }

  getHeroById(id: string): Observable<Hero> {
    return this._loadingService.track(defer(() => {
      const hero = this._heroes().find((item) => item.id === id);
      return hero ? of(cloneHero(hero)) : this._notFound(id);
    }));
  }

  searchHeroesByName(term: string): Observable<Hero[]> {
    return this._loadingService.track(defer(() => {
      const query = term.trim().toLowerCase();
      const matches = this._heroes().filter((hero) =>
        hero.name.toLowerCase().includes(query)
      );
      return of(matches.map(cloneHero));
    }));
  }

  createHero(dto: HeroCreateDto): Observable<Hero> {
    return this._loadingService.track(defer(() => {
      const hero = freezeHero({ ...dto, id: globalThis.crypto.randomUUID() });
      this._heroes.update((current) => freezeHeroes([...current, hero]));
      return of(cloneHero(hero));
    }), minimumMutationLoadingMs);
  }

  updateHero(id: string, dto: HeroUpdateDto): Observable<Hero> {
    return this._loadingService.track(defer(() => {
      const existing = this._heroes().find((hero) => hero.id === id);
      if (!existing) {
        return this._notFound(id);
      }

      const updated = freezeHero({ ...existing, ...dto, id: existing.id });
      this._heroes.update((current) => freezeHeroes(current.map((hero) =>
        hero.id === id ? updated : hero
      )));
      return of(cloneHero(updated));
    }), minimumMutationLoadingMs);
  }

  deleteHero(id: string): Observable<void> {
    return this._loadingService.track(defer(() => {
      if (!this._heroes().some((hero) => hero.id === id)) {
        return this._notFound(id);
      }

      this._heroes.update((current) => freezeHeroes(current.filter((hero) => hero.id !== id)));
      return of(void 0);
    }), minimumMutationLoadingMs);
  }

  private _notFound(id: string): Observable<never> {
    return throwError(() => new HeroServiceError('not-found', `No existe un héroe con id "${id}".`));
  }
}

function cloneHero(hero: Hero): Hero {
  return { ...hero, powers: [...hero.powers] };
}

function freezeHero(hero: Hero): Hero {
  return Object.freeze({ ...hero, powers: Object.freeze([...hero.powers]) });
}

function freezeHeroes(heroes: readonly Hero[]): readonly Hero[] {
  return Object.freeze(heroes.map(freezeHero));
}
