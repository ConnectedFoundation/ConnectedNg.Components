import { Component, input, TemplateRef } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { List, ActionDescriptionWithAction } from '@connected-ng/components';

@Component({
  selector: 'cn-code-list-list',
  imports: [MatListModule, List],
  templateUrl: './code-list-list.html',
  styleUrl: './code-list-list.scss',
})
export class CodeListList<T> {
  items = input.required<T[]>();
  itemTemplate = input.required<TemplateRef<T>>();
  itemActionsTemplate = input<TemplateRef<T>>();
  codeListActions = input<ActionDescriptionWithAction[]>([]);
}
