import { Component, input, TemplateRef } from '@angular/core';
import { MatList, MatListItem } from "@angular/material/list";
import { ExpandableListItem } from "../expandable-list-item/expandable-list-item";
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'cn-list',
  imports: [MatList, MatListItem, NgTemplateOutlet, ExpandableListItem],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List {
  itemTemplate = input.required<TemplateRef<unknown>>();
  itemDetailTemplate = input<TemplateRef<unknown> | undefined>();
  items = input.required<unknown[]>();

  templateContext(item: unknown) {
    return { $implicit: item, item }
  }
}
