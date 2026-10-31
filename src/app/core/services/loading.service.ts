import { Injectable, signal } from '@angular/core';
import {
  concatWith,
  defer,
  EMPTY,
  finalize,
  ignoreElements,
  Observable,
  timer
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly _isLoading = signal<boolean>(false);
  private _pendingOperations = 0;
  readonly isLoading = this._isLoading.asReadonly();

  show(): void {
    this._pendingOperations += 1;
    this._isLoading.set(true);
  }

  hide(): void {
    this._pendingOperations = Math.max(0, this._pendingOperations - 1);
    this._isLoading.set(this._pendingOperations > 0);
  }

  track<T>(operation: Observable<T>, minimumDisplayMs = 0): Observable<T> {
    return defer(() => {
      this.show();
      const startedAt = Date.now();
      const visibleOperation = minimumDisplayMs > 0
        ? operation.pipe(
          concatWith(defer(() => {
            const remainingMs = minimumDisplayMs - (Date.now() - startedAt);
            return remainingMs > 0
              ? timer(remainingMs).pipe(ignoreElements())
              : EMPTY;
          }))
        )
        : operation;

      return visibleOperation.pipe(finalize(() => this.hide()));
    });
  }
}
