import { ComponentFixture, flushMicrotasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { HeroListPageComponent } from './hero-list-page.component';
import { HeroService } from '../../../../core/services/hero.service';
import { Hero } from '../../../../core/models/hero.model';

describe('HeroListPageComponent', () => {
  let component: HeroListPageComponent;
  let fixture: ComponentFixture<HeroListPageComponent>;
  let heroServiceMock: jasmine.SpyObj<HeroService>;
  let dialogOpen: jasmine.Spy;

  const mockHeroes: Hero[] = [
    { id: '1', name: 'Spiderman', realName: 'Peter Parker', powers: ['Web'], universe: 'Marvel', status: 'Active' }
  ];

  beforeEach(async () => {
    heroServiceMock = jasmine.createSpyObj('HeroService', ['searchHeroesByName', 'deleteHero']);
    heroServiceMock.searchHeroesByName.and.returnValue(of(mockHeroes));
    heroServiceMock.deleteHero.and.returnValue(of(void 0));
    dialogOpen = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(false) });

    await TestBed.configureTestingModule({
      imports: [HeroListPageComponent],
      providers: [
        { provide: HeroService, useValue: heroServiceMock },
        { provide: MatDialog, useValue: { open: dialogOpen } },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([])
      ]
    });
    TestBed.overrideProvider(MatDialog, { useValue: { open: dialogOpen } });
    await TestBed.compileComponents();

    fixture = TestBed.createComponent(HeroListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse el componente de la lista', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar la lista de héroes en el ngOnInit', () => {
    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledWith('');
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].name).toBe('Spiderman');
  });

  it('debería conectar el paginador durante la carga inicial y usar cinco filas por página', () => {
    expect(component.dataSource.paginator).toBe(component.paginator);
    expect(component.paginator.pageSize).toBe(5);
  });

  it('debería mostrar opaco y con colores de marca el selector de tamaño del paginador', fakeAsync(() => {
    const pageSizeTrigger = fixture.nativeElement.querySelector(
      '.mat-mdc-paginator .mat-mdc-select-trigger'
    ) as HTMLElement;
    pageSizeTrigger.click();
    fixture.detectChanges();
    tick();

    const panel = document.querySelector('.mat-mdc-select-panel') as HTMLElement;
    const option = panel.querySelector('.mat-mdc-option') as HTMLElement;

    expect(getComputedStyle(panel).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(option).color).toBe('rgb(23, 35, 63)');
    expect(panel.querySelectorAll('.mat-mdc-option').length).toBe(3);
  }));

  it('debería limitar la vista inicial a cinco tarjetas cuando hay más resultados', fakeAsync(() => {
    const paginatedHeroes = Array.from({ length: 7 }, (_, index): Hero => ({
      ...mockHeroes[0],
      id: `${index + 1}`,
      name: `Héroe ${index + 1}`
    }));
    heroServiceMock.searchHeroesByName.and.returnValue(of(paginatedHeroes));

    fixture = TestBed.createComponent(HeroListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flushMicrotasks();

    expect(fixture.nativeElement.querySelectorAll('.hero-card').length).toBe(5);
    expect(component.paginator.length).toBe(7);
  }));

  it('debería reflejar el total de resultados en un estado derivado', () => {
    expect(component.resultCount()).toBe(1);
    expect(fixture.nativeElement.querySelector('[data-testid="hero-result-count"]')?.textContent).toContain('1');
  });

  it('debería esperar 300 ms antes de buscar el término normalizado', fakeAsync(() => {
    component.searchControl.setValue('  man  ');

    tick(299);
    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledTimes(1);

    tick(1);
    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledTimes(2);
    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledWith('man');
  }));

  it('no debería repetir la búsqueda si solo cambia el uso de mayúsculas', fakeAsync(() => {
    component.searchControl.setValue('man');
    tick(300);
    component.searchControl.setValue(' MAN ');
    tick(300);

    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledTimes(2);
    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledWith('man');
  }));

  it('debería limpiar resultados obsoletos y permitir reintentar el término actual tras un error', fakeAsync(() => {
    heroServiceMock.searchHeroesByName.and.callFake((term: string): Observable<Hero[]> =>
      term === 'bat' ? throwError(() => new Error('network')) : of(mockHeroes)
    );
    fixture = TestBed.createComponent(HeroListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.searchControl.setValue('bat');
    tick(300);
    fixture.detectChanges();

    expect(component.dataSource.data).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('.hero-card').length).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar');
    expect(fixture.nativeElement.querySelector('[data-testid="retry-search"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.table-error-state')?.getAttribute('aria-live')).toBe('assertive');

    component.searchControl.setValue('spider');
    component.retrySearch();
    fixture.detectChanges();

    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledWith('spider');
    expect(component.dataSource.data).toEqual(mockHeroes);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  }));

  it('debería indicar que una búsqueda vacía es distinta de un error', () => {
    heroServiceMock.searchHeroesByName.and.returnValue(of([]));
    fixture = TestBed.createComponent(HeroListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mobile-empty-state')?.textContent).toContain('No se encontraron');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('debería cancelar la búsqueda anterior cuando llega un término más reciente', fakeAsync(() => {
    const firstSearch = new Subject<Hero[]>();
    const secondSearch = new Subject<Hero[]>();
    const searches = new Map<string, Subject<Hero[]>>([
      ['spi', firstSearch],
      ['bat', secondSearch]
    ]);
    heroServiceMock.searchHeroesByName.and.callFake((term: string): Observable<Hero[]> =>
      searches.get(term)?.asObservable() ?? of(mockHeroes)
    );

    component.searchControl.setValue('spi');
    tick(300);
    expect(firstSearch.observed).toBeTrue();

    component.searchControl.setValue('bat');
    tick(300);

    expect(firstSearch.observed).toBeFalse();
    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledWith('bat');
  }));

  it('no debería borrar el héroe si se cancela la confirmación', () => {
    dialogOpen.and.returnValue({ afterClosed: () => of(false) });

    component.onDeleteHero(mockHeroes[0]);

    expect(heroServiceMock.deleteHero).not.toHaveBeenCalled();
  });

  it('debería borrar y volver a consultar los héroes al confirmar', () => {
    dialogOpen.and.returnValue({ afterClosed: () => of(true) });

    component.onDeleteHero(mockHeroes[0]);

    expect(heroServiceMock.deleteHero).toHaveBeenCalledOnceWith('1');
    expect(heroServiceMock.searchHeroesByName).toHaveBeenCalledTimes(2);
  });

  it('debería aplicar la superficie de marca opaca al diálogo de confirmación', () => {
    component.onDeleteHero(mockHeroes[0]);

    expect(dialogOpen).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({
      panelClass: 'brand-confirm-dialog'
    }));
  });

  it('debería mantener en móvil los mismos colores del estado que en la tabla', () => {
    const frame = document.createElement('iframe');
    frame.width = '375';
    frame.height = '812';
    document.body.appendChild(frame);

    const frameDocument = frame.contentDocument as Document;
    const copiedStyles = Array.from(document.styleSheets).map((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n');
      } catch {
        return '';
      }
    }).join('\n');
    const style = frameDocument.createElement('style');
    style.textContent = copiedStyles;
    frameDocument.head.appendChild(style);
    frameDocument.body.appendChild(fixture.nativeElement.querySelector('.container').cloneNode(true));

    const mobileBadge = frameDocument.querySelector('.mobile-list .status-badge') as HTMLElement;
    const tableBadge = frameDocument.querySelector('.table-container .status-badge') as HTMLElement;
    const mobileStyle = frame.contentWindow?.getComputedStyle(mobileBadge) as CSSStyleDeclaration;
    const tableStyle = frame.contentWindow?.getComputedStyle(tableBadge) as CSSStyleDeclaration;

    expect(frame.contentWindow?.matchMedia('(max-width: 640px)').matches).toBeTrue();
    expect(mobileStyle.backgroundColor).toBe('rgb(243, 244, 246)');
    expect(mobileStyle.color).toBe('rgb(23, 35, 63)');
    expect(mobileStyle.backgroundColor).toBe(tableStyle.backgroundColor);
    expect(mobileStyle.color).toBe(tableStyle.color);

    frame.remove();
  });

  it('debería mostrar una tarjeta móvil con los datos y acciones del héroe', () => {
    const card = fixture.nativeElement.querySelector('.hero-card') as HTMLElement | null;

    expect(card).not.toBeNull();
    expect(card?.textContent).toContain('Spiderman');
    expect(card?.textContent).toContain('Peter Parker');
    expect(card?.textContent).toContain('Marvel');
    expect(card?.querySelector('[aria-label="Ver detalle de Spiderman"]')).not.toBeNull();
    expect(card?.querySelector('[aria-label="Editar Spiderman"]')).not.toBeNull();
    expect(card?.querySelector('[aria-label="Borrar Spiderman"]')).not.toBeNull();
  });
});

describe('HeroListPageComponent with the real HeroService', () => {
  let fixture: ComponentFixture<HeroListPageComponent>;
  let service: HeroService;
  const navigationState: { createdHeroId?: string } = {};

  beforeEach(async () => {
    delete navigationState.createdHeroId;
    await TestBed.configureTestingModule({
      imports: [HeroListPageComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: Router, useValue: { getCurrentNavigation: () => ({ extras: { state: navigationState } }) } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    }).compileComponents();

    service = TestBed.inject(HeroService);
    fixture = TestBed.createComponent(HeroListPageComponent);
    fixture.detectChanges();
  });

  it('shows five seeded heroes on each page and advances to the remaining five', fakeAsync(() => {
    expect(service.heroes()).toHaveSize(10);
    const firstPageNames = readMobileCardNames(fixture);

    expect(firstPageNames).toHaveSize(5);
    expect(firstPageNames).toEqual(service.heroes().slice(0, 5).map(({ name }) => name));

    const nextPageButton = fixture.nativeElement.querySelector(
      '.mat-mdc-paginator-navigation-next'
    ) as HTMLButtonElement;
    expect(nextPageButton.disabled).toBeFalse();
    nextPageButton.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const secondPageNames = readMobileCardNames(fixture);
    expect(secondPageNames).toHaveSize(5);
    expect(secondPageNames).toEqual(service.heroes().slice(5).map(({ name }) => name));
    expect(secondPageNames).not.toEqual(firstPageNames);
    expect(secondPageNames.some((name) => firstPageNames.includes(name))).toBeFalse();
  }));

  it('opens the page containing the newly created hero and keeps it searchable', fakeAsync(() => {
    service.createHero({
      name: 'TEST HERO',
      realName: 'Temporary Record',
      powers: ['Validation'],
      universe: 'Local',
      status: 'Active'
    }).subscribe();
    const createdHero = service.heroes().find(({ name }) => name === 'TEST HERO');
    expect(createdHero).toBeDefined();
    if (!createdHero) {
      return;
    }
    navigationState.createdHeroId = createdHero.id;
    fixture.destroy();

    fixture = TestBed.createComponent(HeroListPageComponent);
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('TEST HERO');
    expect(fixture.componentInstance.paginator.pageIndex).toBe(2);

    fixture.componentInstance.searchControl.setValue('TEST HERO');
    tick(300);
    fixture.detectChanges();

    expect(fixture.componentInstance.dataSource.data.map(({ id }) => id)).toEqual([createdHero.id]);
    expect(readMobileCardNames(fixture)).toEqual(['TEST HERO']);
  }));

  function readMobileCardNames(componentFixture: ComponentFixture<HeroListPageComponent>): string[] {
    const headings = componentFixture.nativeElement.querySelectorAll(
      '.mobile-list .hero-card h2'
    ) as NodeListOf<HTMLElement>;
    return Array.from(headings, (heading) => heading.textContent?.trim() ?? '');
  }
});
