import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();
  });

  it('debería crear la aplicación correctamente', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('muestra la marca Mindata como una palabra accesible en la cabecera', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const logo = fixture.nativeElement.querySelector('.brand-wordmark img');

    expect(logo).toBeTruthy();
    expect(logo.getAttribute('src')).toBe('/mindata-logo.png');
    expect(logo.getAttribute('alt')).toBe('MinData');
  });
});
