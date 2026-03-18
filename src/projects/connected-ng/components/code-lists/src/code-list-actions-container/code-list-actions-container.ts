import { Component, computed, effect, input, signal } from '@angular/core';
import { ActionDescriptionWithAction, ActionTile } from '@connected-ng/components';
import { CodeListAction, convertToAction } from './code-list-actions';

@Component({
  selector: 'cn-code-list-actions-container',
  imports: [ActionTile],
  templateUrl: './code-list-actions-container.html',
  styleUrl: './code-list-actions-container.scss',
})
export class CodeListActionsContainer {
  item = input.required<unknown>();
  internalActions = signal<ActionDescriptionWithAction[]>([]);
  actions = input.required<CodeListAction[]>();

  constructor() {
    effect(() => {
      if (!this.item())
        return;

      this.internalActions.set(this.actions().map(f => convertToAction(f, this.item())));
    });
  }

  handleItemClick(item: ActionDescriptionWithAction, $event: Event) {
    if (item.action) {
      $event.preventDefault();
      $event.stopPropagation();
      item.action();
      return;
    }
  }
}
