import { Component, computed, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export type ItemAction = (item: any) => void;
export type UrlParameter = string | ((item: any) => string);

export interface ActionDescription {
  icon?: string;
  label: string;
  description?: string;
}

export interface ActionDescriptionWithAction extends ActionDescription {
  action?: () => void;
  url?: UrlParameter;
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
  url = input<UrlParameter | undefined>();

  urlString = computed(() => {
    const urlValue = this.url();
    if (typeof urlValue === 'function') {
      return urlValue({});
    }
    return urlValue;
  });
}
