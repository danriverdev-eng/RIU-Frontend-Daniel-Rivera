import { TestBed } from '@angular/core/testing';
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
});
