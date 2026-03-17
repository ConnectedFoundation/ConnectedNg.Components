import { Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'cf-busy-wrapper',
  imports: [MatProgressBarModule, MatProgressSpinnerModule],
  templateUrl: './busy-wrapper.html',
  styleUrl: './busy-wrapper.scss',
})
export class BusyWrapper {
  active = input(false);
  type = input<CfBusyType>('spinner');
  block = input(true);
}

export type CfBusyType = 'spinner' | 'bar' | 'none';