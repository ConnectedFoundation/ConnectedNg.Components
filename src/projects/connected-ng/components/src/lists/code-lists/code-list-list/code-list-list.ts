import { Component, input, TemplateRef } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { List } from "../../list/list";

@Component({
  selector: 'cn-code-list-list',
  imports: [MatListModule, List],
  templateUrl: './code-list-list.html',
  styleUrl: './code-list-list.scss',
})
export class CodeListList<T> {
  items = input.required<T[]>();
  itemTemplate = input.required<TemplateRef<T>>();
  actionsTemplate = input.required<TemplateRef<T>>();
}
