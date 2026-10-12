import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly _isLoading = signal<boolean>(false);
  private pendingOperations = 0;
  readonly isLoading = this._isLoading.asReadonly();

  show(): void {
    this.pendingOperations += 1;
    this._isLoading.set(true);
  }

  hide(): void {
    this.pendingOperations = Math.max(0, this.pendingOperations - 1);
    this._isLoading.set(this.pendingOperations > 0);
  }
}
