import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, tap, timer } from 'rxjs';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LoadingService] });
    service = TestBed.inject(LoadingService);
  });

  it('keeps loading active until every concurrent operation completes', () => {
    service.show();
    service.show();

    expect(service.isLoading()).toBeTrue();

    service.hide();

    expect(service.isLoading()).toBeTrue();

    service.hide();

    expect(service.isLoading()).toBeFalse();
  });

  it('remains idle when completion is reported without a pending operation', () => {
    service.hide();

    expect(service.isLoading()).toBeFalse();
  });

  it('tracks an observable operation through completion', () => {
    let wasLoadingDuringEmission = false;

    service.track(of('complete').pipe(
      tap(() => wasLoadingDuringEmission = service.isLoading())
    )).subscribe();

    expect(wasLoadingDuringEmission).toBeTrue();
    expect(service.isLoading()).toBeFalse();
  });

  it('honors the minimum display duration without extending a longer operation', fakeAsync(() => {
    service.track(of('complete'), 150).subscribe();

    expect(service.isLoading()).toBeTrue();
    tick(149);
    expect(service.isLoading()).toBeTrue();
    tick(1);
    expect(service.isLoading()).toBeFalse();

    let longerOperationCompleted = false;
    service.track(timer(200), 150).subscribe(() => longerOperationCompleted = true);
    tick(199);
    expect(service.isLoading()).toBeTrue();
    tick(1);
    expect(service.isLoading()).toBeFalse();
    expect(longerOperationCompleted).toBeTrue();
  }));
});
