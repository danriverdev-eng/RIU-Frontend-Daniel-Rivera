import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]',
  standalone: true
})
export class UppercaseDirective {
  private readonly _ngControl = inject(NgControl, { optional: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    const uppercaseValue = input.value.toUpperCase();

    if (this._ngControl && this._ngControl.control) {
      this._ngControl.control.setValue(uppercaseValue, { emitEvent: false });
    } else {
      input.value = uppercaseValue;
    }

    if (start !== null && end !== null) {
      input.setSelectionRange(start, end);
    }
  }
}
