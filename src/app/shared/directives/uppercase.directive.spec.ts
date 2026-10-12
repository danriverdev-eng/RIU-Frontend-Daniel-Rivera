import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UppercaseDirective } from './uppercase.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UppercaseDirective],
  template: `<input [formControl]="control" appUppercase />`
})
class TestComponent {
  control = new FormControl('');
}

describe('UppercaseDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let inputEl: HTMLInputElement;
  let component: TestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('debería convertir el texto ingresado a mayúsculas en el control reactivo', () => {
    inputEl.value = 'spiderman';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(inputEl.value).toBe('SPIDERMAN');
    expect(component.control.value).toBe('SPIDERMAN');
  });

  it('debería preservar la posición del cursor al convertir el texto', () => {
    inputEl.value = 'spiderman';
    inputEl.setSelectionRange(4, 4);
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(inputEl.value).toBe('SPIDERMAN');
    expect(inputEl.selectionStart).toBe(4);
    expect(inputEl.selectionEnd).toBe(4);
  });
});
