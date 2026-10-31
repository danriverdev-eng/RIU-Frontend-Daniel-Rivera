import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressBarModule],
  template: `
    @if (loadingService.isLoading()) {
      <div role="status" aria-label="Cargando" aria-live="polite">
        <mat-progress-bar mode="indeterminate" color="accent" aria-hidden="true"></mat-progress-bar>
      </div>
    }
  `,
  styles: [`
    mat-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
    }
  `]
})
export class LoadingSpinnerComponent {
  readonly loadingService = inject(LoadingService);
}
