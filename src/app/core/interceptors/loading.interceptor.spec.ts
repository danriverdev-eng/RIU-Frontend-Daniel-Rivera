import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoadingService } from '../services/loading.service';
import { loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let httpTesting: HttpTestingController;
  let loadingService: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting()
      ]
    });
    httpTesting = TestBed.inject(HttpTestingController);
    loadingService = TestBed.inject(LoadingService);
  });

  afterEach(() => httpTesting.verify());

  it('keeps the global loading state active while concurrent requests remain pending', () => {
    const client = TestBed.inject(HttpClient);
    client.get('/heroes/1').subscribe();
    client.get('/heroes/2').subscribe();

    const first = httpTesting.expectOne('/heroes/1');
    const second = httpTesting.expectOne('/heroes/2');

    expect(loadingService.isLoading()).toBeTrue();

    first.flush({ id: '1' });

    expect(loadingService.isLoading()).toBeTrue();

    second.flush({ id: '2' });

    expect(loadingService.isLoading()).toBeFalse();
  });
});
