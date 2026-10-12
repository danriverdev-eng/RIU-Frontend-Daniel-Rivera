import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, LoadingSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
