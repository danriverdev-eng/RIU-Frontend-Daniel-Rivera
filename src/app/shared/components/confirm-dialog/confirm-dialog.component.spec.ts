import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let close: jasmine.Spy;

  beforeEach(() => {
    close = jasmine.createSpy('close');
    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Eliminar héroe', message: '¿Confirmas?' } },
        { provide: MatDialogRef, useValue: { close } }
      ]
    });
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
  });

  it('closes with false when the user cancels', () => {
    findButton('Cancelar').click();

    expect(close).toHaveBeenCalledOnceWith(false);
  });

  it('closes with true when the user confirms', () => {
    findButton('Confirmar').click();

    expect(close).toHaveBeenCalledOnceWith(true);
  });

  function findButton(label: string): HTMLButtonElement {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((element) => element.textContent?.trim() === label);
    if (!button) {
      throw new Error('Button not rendered: ' + label);
    }
    return button;
  }
});
