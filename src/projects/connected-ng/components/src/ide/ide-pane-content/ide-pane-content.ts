import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IdePane } from '../services/ide-layout-service';

@Component({
  selector: 'cf-ide-pane-content',
  imports: [
    MatButtonModule
  ],
  templateUrl: './ide-pane-content.html',
  styleUrl: './ide-pane-content.scss',
})
export class IdePaneContent {
  pane = input.required<IdePane>();
}
