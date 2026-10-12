import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingService } from '../../../core/services/loading.service';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let fixture: ComponentFixture<LoadingSpinnerComponent>;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [LoadingSpinnerComponent] });
    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    loadingService = TestBed.inject(LoadingService);
    fixture.detectChanges();
  });

  it('announces loading state with an accessible status name', () => {
    loadingService.show();
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;

    expect(status).not.toBeNull();
    expect(status.getAttribute('aria-label')).toBe('Cargando');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('does not render a loading status while idle', () => {
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});
