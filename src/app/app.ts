import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Timeline } from './timeline/timeline/timeline';

@Component({
  selector: 'app-root',
  imports: [Timeline],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('time-grid');
}
