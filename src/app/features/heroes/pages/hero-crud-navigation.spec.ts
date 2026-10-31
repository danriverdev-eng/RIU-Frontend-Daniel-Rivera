import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { HeroFormPageComponent } from './hero-form-page/hero-form-page.component';
import { HeroDetailPageComponent } from './hero-detail-page/hero-detail-page.component';
import { HeroListPageComponent } from './hero-list-page/hero-list-page.component';
import { HeroService } from '../../../core/services/hero.service';
import { routes } from '../../../app.routes';

describe('Hero CRUD navigation with the real service', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let heroService: HeroService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    heroService = TestBed.inject(HeroService);
    harness = await RouterTestingHarness.create();
  });

  it('shows the created hero and increments the count after returning to the list', async () => {
    const form = await harness.navigateByUrl('/heroes/new', HeroFormPageComponent);
    form.heroForm.setValue({
      name: 'TEST HERO',
      realName: 'Temporary Record',
      powers: 'Validation',
      universe: 'Local',
      status: 'Active'
    });
    harness.fixture.detectChanges();

    (harness.routeNativeElement?.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(router.url).toBe('/heroes');
    expect(heroService.heroes()).toHaveSize(11);
    expect(harness.routeNativeElement?.textContent).toContain('11 héroes encontrados');
    expect(harness.routeNativeElement?.textContent).toContain('TEST HERO');
  });

  it('shows the updated hero data after returning to the list', async () => {
    const form = await harness.navigateByUrl('/heroes/edit/1', HeroFormPageComponent);
    form.heroForm.controls.realName.setValue('Peter Parker actualizado');

    (harness.routeNativeElement?.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(router.url).toBe('/heroes');
    expect(heroService.heroes().find(({ id }) => id === '1')?.realName)
      .toBe('Peter Parker actualizado');
    expect(harness.routeNativeElement?.textContent).toContain('Peter Parker actualizado');
  });

  it('shows the selected hero details and provides an edit link', async () => {
    const detail = await harness.navigateByUrl('/heroes/1', HeroDetailPageComponent);

    expect(detail.hero()?.name).toBe('Spiderman');
    expect(harness.routeNativeElement?.textContent).toContain('Peter Parker');
    expect(harness.routeNativeElement?.textContent).toContain('Sentido arácnido');
    expect(harness.routeNativeElement?.querySelector('a[href="/heroes/edit/1"]')).not.toBeNull();
  });

  it('opens the detail page from an accessible list action', async () => {
    await harness.navigateByUrl('/heroes', HeroListPageComponent);
    const viewButton = harness.routeNativeElement?.querySelector(
      '[aria-label="Ver detalle de Spiderman"]'
    ) as HTMLButtonElement;

    viewButton.click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(router.url).toBe('/heroes/1');
    expect(harness.routeNativeElement?.textContent).toContain('Sentido arácnido');
  });
});
