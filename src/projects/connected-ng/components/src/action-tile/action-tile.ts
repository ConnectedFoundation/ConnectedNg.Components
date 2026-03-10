import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export interface ActionDescription {
  icon?: string;
  label: string;
  description?: string;
}

export interface ActionDescriptionWithAction extends ActionDescription {
  action: () => void;
}

@Component({
  selector: 'cn-action-tile',
  imports: [MatIcon],
  templateUrl: './action-tile.html',
  styleUrl: './action-tile.scss',
})
export class ActionTile {
  icon = input<string | undefined>('');

  label = input.required<string>();
  description = input<string | undefined>('');
}
