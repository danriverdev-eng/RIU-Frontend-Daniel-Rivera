import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HeroService, HeroServiceError } from './hero.service';
import { HeroCreateDto, HeroUpdateDto } from '../models/hero.model';
import { LoadingService } from './loading.service';

describe('HeroService', () => {
  let service: HeroService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [HeroService] });
    service = TestBed.inject(HeroService);
  });

  it('provides an initial in-memory collection through a readonly signal', () => {
    expect(service.heroes()).toHaveSize(10);
    expect(service.heroes()[0].name).toBe('Spiderman');
    expect(Object.isFrozen(service.heroes())).toBeTrue();
  });

  it('completes a create-read-search-update-delete lifecycle on the real service instance', async () => {
    const uniqueName = `Lifecycle ${globalThis.crypto.randomUUID()}`;
    const createDto: HeroCreateDto = {
      name: uniqueName,
      realName: 'Test Identity',
      powers: ['Integration test'],
      universe: 'Local',
      status: 'Active'
    };

    const created = await firstValueFrom(service.createHero(createDto));
    const retrieved = await firstValueFrom(service.getHeroById(created.id));
    const searchResults = await firstValueFrom(service.searchHeroesByName(uniqueName));

    expect(retrieved).toEqual(jasmine.objectContaining(createDto));
    expect(searchResults.map(({ id }) => id)).toContain(created.id);

    const updateDto: HeroUpdateDto = {
      realName: 'Updated Test Identity',
      status: 'Inactive'
    };
    const updated = await firstValueFrom(service.updateHero(created.id, updateDto));
    expect(updated).toEqual(jasmine.objectContaining(updateDto));
    expect(updated.id).toBe(created.id);

    await firstValueFrom(service.deleteHero(created.id));

    expect(service.heroes().some(({ id }) => id === created.id)).toBeFalse();
    expect(await firstValueFrom(service.searchHeroesByName(uniqueName))).toEqual([]);
    await expectAsync(firstValueFrom(service.getHeroById(created.id)))
      .toBeRejectedWith(jasmine.any(HeroServiceError));
  });

  it('returns the complete collection without exposing mutable state', async () => {
    const heroes = await firstValueFrom(service.getHeroes());
    (heroes[0].powers as string[]).push('mutated');

    expect(service.heroes()[0].powers).not.toContain('mutated');
  });

  it('retrieves one hero by id', async () => {
    const hero = await firstValueFrom(service.getHeroById('1'));

    expect(hero.name).toBe('Spiderman');
  });

  it('emits a typed not-found error when an id does not exist', async () => {
    const error = await firstValueFrom(service.getHeroById('missing'))
      .catch((failure: unknown) => failure);

    expect(error).toEqual(jasmine.any(HeroServiceError));
    expect(error).toEqual(jasmine.objectContaining({ code: 'not-found' }));
  });

  it('searches name substrings without regard to case or surrounding spaces', async () => {
    const heroes = await firstValueFrom(service.searchHeroesByName('  mAn  '));

    expect(heroes.map(({ name }) => name)).toEqual([
      'Spiderman',
      'Superman',
      'Batman',
      'Manolito el fuerte',
      'Wonder Woman'
    ]);
  });

  it('returns the whole collection for an empty search term', async () => {
    const heroes = await firstValueFrom(service.searchHeroesByName('  '));

    expect(heroes.length).toBe(service.heroes().length);
  });

  it('creates a hero with a generated id and updates the readonly state', async () => {
    const dto: HeroCreateDto = {
      name: 'BATMAN',
      realName: 'Bruce Wayne',
      powers: ['Gadgets'],
      universe: 'DC',
      status: 'Active'
    };
    const hero = await firstValueFrom(service.createHero(dto));

    expect(hero.id).toBeTruthy();
    expect(hero).toEqual(jasmine.objectContaining(dto));
    expect(service.heroes().some(({ id }) => id === hero.id)).toBeTrue();
  });

  it('updates fields immutably and keeps the requested id', async () => {
    const original = service.heroes()[0];
    const attemptedIdOverride: HeroUpdateDto = Object.assign(
      { name: 'SPIDER-MAN', powers: ['Web', 'Agility'] },
      { id: 'attacker-controlled-id' }
    );
    const result = await firstValueFrom(service.updateHero('1', attemptedIdOverride));

    expect(result.id).toBe('1');
    expect(result.name).toBe('SPIDER-MAN');
    expect(result.realName).toBe(original.realName);
    expect(original.name).toBe('Spiderman');
    expect(service.heroes()[0].id).toBe('1');
  });

  it('reports not-found for updates and deletes of missing heroes', async () => {
    await expectAsync(firstValueFrom(service.updateHero('missing', { name: 'X' })))
      .toBeRejectedWith(jasmine.any(HeroServiceError));
    await expectAsync(firstValueFrom(service.deleteHero('missing')))
      .toBeRejectedWith(jasmine.any(HeroServiceError));
  });

  it('deletes an existing hero from the state', async () => {
    await firstValueFrom(service.deleteHero('1'));

    expect(service.heroes().some(({ id }) => id === '1')).toBeFalse();
  });

  it('keeps the global indicator visible during in-memory create, update and delete', fakeAsync(() => {
    const loadingService = TestBed.inject(LoadingService);
    const name = `Loading ${globalThis.crypto.randomUUID()}`;
    const dto: HeroCreateDto = {
      name,
      realName: 'Loading Test',
      powers: ['Visibility'],
      universe: 'Local',
      status: 'Active'
    };
    let createdId = '';

    service.createHero(dto).subscribe((hero) => createdId = hero.id);
    expect(loadingService.isLoading()).toBeTrue();
    expect(service.heroes().some((hero) => hero.name === name)).toBeTrue();
    tick(150);
    expect(loadingService.isLoading()).toBeFalse();

    service.updateHero(createdId, { realName: 'Updated Loading Test' }).subscribe();
    expect(loadingService.isLoading()).toBeTrue();
    tick(150);
    expect(loadingService.isLoading()).toBeFalse();

    service.deleteHero(createdId).subscribe();
    expect(loadingService.isLoading()).toBeTrue();
    tick(150);
    expect(loadingService.isLoading()).toBeFalse();
    expect(service.heroes().some((hero) => hero.id === createdId)).toBeFalse();
  }));

  it('does not apply the mutation display duration to reads and searches', () => {
    const loadingService = TestBed.inject(LoadingService);
    let readCompleted = false;
    let searchCompleted = false;

    service.getHeroById('1').subscribe(() => readCompleted = true);
    service.searchHeroesByName('man').subscribe(() => searchCompleted = true);

    expect(readCompleted).toBeTrue();
    expect(searchCompleted).toBeTrue();
    expect(loadingService.isLoading()).toBeFalse();
  });
});
