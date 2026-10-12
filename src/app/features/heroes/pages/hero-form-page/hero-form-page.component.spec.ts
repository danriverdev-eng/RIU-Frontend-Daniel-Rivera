import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { MatSelect } from '@angular/material/select';
import { Subject, of, throwError } from 'rxjs';

import { Hero, HeroCreateDto, HeroUpdateDto } from '../../../../core/models/hero.model';
import { HeroService } from '../../../../core/services/hero.service';
import { HeroFormPageComponent } from './hero-form-page.component';

describe('HeroFormPageComponent', () => {
  let fixture: ComponentFixture<HeroFormPageComponent>;
  let component: HeroFormPageComponent;
  let heroService: jasmine.SpyObj<HeroService>;
  let router: jasmine.SpyObj<Router>;
  let routeId: string | null;

  const hero: Hero = {
    id: 'hero-1',
    name: 'SPIDERMAN',
    realName: 'Peter Parker',
    powers: ['Sentido arácnido', 'Trepar paredes'],
    universe: 'Marvel',
    status: 'Active'
  };

  beforeEach(async () => {
    routeId = null;
    heroService = jasmine.createSpyObj<HeroService>('HeroService', [
      'getHeroById',
      'createHero',
      'updateHero'
    ]);
    heroService.getHeroById.and.returnValue(of(hero));
    heroService.createHero.and.returnValue(of({ ...hero }));
    heroService.updateHero.and.returnValue(of({ ...hero }));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HeroFormPageComponent],
      providers: [
        { provide: HeroService, useValue: heroService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']) },
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(HeroFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function fillValidForm(): void {
    component.heroForm.setValue({
      name: 'SPIDERMAN',
      realName: ' Peter Parker ',
      powers: ' Sentido arácnido, Trepar paredes ',
      universe: 'Marvel',
      status: 'Active'
    });
  }

  it('crea un formulario sin mostrar errores antes de interactuar', () => {
    createComponent();

    expect(component.heroForm.invalid).toBeTrue();
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
  });

  it('aplica la clase de superficie de marca a los dos paneles de selección', () => {
    createComponent();

    const selectPanels = fixture.debugElement.queryAll(By.directive(MatSelect))
      .map((element) => element.componentInstance.panelClass);

    expect(selectPanels).toEqual(['brand-select-panel', 'brand-select-panel']);
  });

  it('renderiza el menú abierto con fondo blanco opaco y texto azul marino', fakeAsync(() => {
    createComponent();
    const select = fixture.debugElement.query(By.directive(MatSelect)).componentInstance as MatSelect;

    select.open();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const panel = document.body.querySelector('.brand-select-panel') as HTMLElement | null;
    expect(panel).not.toBeNull();
    expect(getComputedStyle(panel as HTMLElement).backgroundColor).toBe('rgb(255, 255, 255)');
    const option = panel?.querySelector('.mat-mdc-option') as HTMLElement | null;
    expect(getComputedStyle(option as HTMLElement).color).toBe('rgb(23, 35, 63)');

    select.close();
    tick();
  }));

  it('requiere valores con contenido y al menos un poder válido', () => {
    createComponent();
    component.heroForm.setValue({
      name: '   ',
      realName: '   ',
      powers: ' ,   ',
      universe: 'Marvel',
      status: 'Active'
    });

    expect(component.heroForm.invalid).toBeTrue();
    expect(component.heroForm.controls.name.hasError('required')).toBeTrue();
    expect(component.heroForm.controls.realName.hasError('required')).toBeTrue();
    expect(component.heroForm.controls.powers.hasError('required')).toBeTrue();
  });

  it('rechaza alias de menos de tres caracteres ignorando espacios', () => {
    createComponent();
    component.heroForm.controls.name.setValue(' A ');

    expect(component.heroForm.controls.name.hasError('minlength')).toBeTrue();
  });

  it('muestra errores de validación después de tocar el campo', () => {
    createComponent();
    component.heroForm.controls.name.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El nombre es obligatorio.');
  });

  it('convierte el alias a mayúsculas al escribir', () => {
    createComponent();
    const input = fixture.nativeElement.querySelector('input[formControlName="name"]') as HTMLInputElement;
    input.value = 'spiderman';
    input.dispatchEvent(new Event('input'));

    expect(component.heroForm.controls.name.value).toBe('SPIDERMAN');
  });

  it('mapea y normaliza explícitamente el DTO al crear', () => {
    createComponent();
    fillValidForm();

    component.onSubmit();

    expect(heroService.createHero).toHaveBeenCalledOnceWith({
      name: 'SPIDERMAN',
      realName: 'Peter Parker',
      powers: ['Sentido arácnido', 'Trepar paredes'],
      universe: 'Marvel',
      status: 'Active'
    } satisfies HeroCreateDto);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/heroes'], {
      state: { createdHeroId: hero.id }
    });
  });

  it('no permite envíos duplicados mientras se guarda', () => {
    createComponent();
    fillValidForm();
    const pendingSave = new Subject<Hero>();
    heroService.createHero.and.returnValue(pendingSave);

    component.onSubmit();
    component.onSubmit();

    expect(heroService.createHero).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting).toBeTrue();
    pendingSave.next(hero);
    pendingSave.complete();
    expect(component.isSubmitting).toBeFalse();
  });

  it('conserva el formulario y comunica el error al fallar el guardado', () => {
    createComponent();
    fillValidForm();
    heroService.createHero.and.returnValue(throwError(() => new Error('offline')));

    component.onSubmit();

    expect(component.errorMessage).toContain('Error al crear');
    expect(component.isSubmitting).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('carga los datos existentes y mapea explícitamente el DTO al editar', () => {
    routeId = 'hero-1';
    createComponent();

    expect(component.isEditMode).toBeTrue();
    expect(component.heroForm.getRawValue()).toEqual({
      name: 'SPIDERMAN',
      realName: 'Peter Parker',
      powers: 'Sentido arácnido, Trepar paredes',
      universe: 'Marvel',
      status: 'Active'
    });

    component.heroForm.controls.realName.setValue('Peter Parker actualizado');
    component.onSubmit();

    expect(heroService.updateHero).toHaveBeenCalledOnceWith('hero-1', {
      name: 'SPIDERMAN',
      realName: 'Peter Parker actualizado',
      powers: ['Sentido arácnido', 'Trepar paredes'],
      universe: 'Marvel',
      status: 'Active'
    } satisfies HeroUpdateDto);
  });

  it('mantiene la pantalla y el error visible cuando falla la carga', () => {
    routeId = 'missing';
    heroService.getHeroById.and.returnValue(throwError(() => new Error('not found')));
    createComponent();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('Error al cargar');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('mantiene el estado de carga hasta que responde la consulta', () => {
    routeId = 'hero-1';
    const pendingLoad = new Subject<Hero>();
    heroService.getHeroById.and.returnValue(pendingLoad);
    createComponent();

    expect(component.isLoading).toBeTrue();
    pendingLoad.next(hero);
    pendingLoad.complete();
    expect(component.isLoading).toBeFalse();
  });
});
