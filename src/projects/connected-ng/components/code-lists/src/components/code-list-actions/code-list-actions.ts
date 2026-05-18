import { Component, computed, input } from '@angular/core';
import { ActionDescriptionWithAction, ActionTile } from '@connected-ng/components';
import { CodeListAction, convertToAction } from '../code-list-actions-container/code-list-actions';

@Component({
  selector: 'cn-code-list-actions',
  imports: [ActionTile],
  templateUrl: './code-list-actions.html',
})
export class CodeListActionsComponent {
  item = input.required<unknown>();
  leftActions = input<CodeListAction[]>([]);
  rightActions = input<CodeListAction[]>([]);

  leftResolved = computed(() =>
    this.leftActions().map(a => convertToAction(a, this.item()))
  );
  rightResolved = computed(() =>
    this.rightActions().map(a => convertToAction(a, this.item()))
  );

  handleItemClick(item: ActionDescriptionWithAction, $event: Event) {
    if (item.action) {
      $event.preventDefault();
      $event.stopPropagation();
      item.action();
      return;
    }
  }
}
