import { Component, computed, input, signal, TemplateRef, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ActionDescription } from "../../action-tile/action-tile";

interface ExpandableItemAction extends ActionDescription {
  action: (item: ExpandableListItem) => void;
}

@Component({
  selector: 'cn-expandable-list-item',
  imports: [NgTemplateOutlet, MatButtonModule],
  templateUrl: './expandable-list-item.html',
  styleUrl: './expandable-list-item.scss',
})
export class ExpandableListItem {
  item = input.required<any>();

  itemTemplate = input<TemplateRef<any> | undefined>();

  detailTemplate = input<TemplateRef<any> | undefined>();

  templateContext = computed(() => { return { $implicit: this.item(), item: this.item(), ctx: { isExpanded: this.isExpanded() } }; });

  isExpanded = signal<boolean>(false);

  toggleExpanded() {
    this.isExpanded.set(!this.isExpanded());
  }

  onClick() {
    this.toggleExpanded();
  }
}
