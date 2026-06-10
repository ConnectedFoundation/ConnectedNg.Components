import { Component, effect, input, model, output, signal, computed, TemplateRef, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'cn-code-list-link-form',
  imports: [
    NgTemplateOutlet,
    FormsModule,
    ScrollingModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './code-list-link-form.html',
  styleUrl: './code-list-link-form.scss',
  host: { class: 'cn-code-list-link-form' },
})
export class CodeListLinkForm<TItem extends Record<string, any>> {
  items = input<TItem[]>([]);
  immutableItems = input<any[]>([]);
  itemTemplate = input.required<TemplateRef<{ $implicit: TItem }>>();
  keyField = input<string>('id');
  itemSize = input<number>(48);
  paginate = input(false);
  pageSize = input<number>(20);
  pageSizeOptions = input<number[]>([5, 10, 25]);
  hidePageSize = input(true);
  selectedValues = model<any[]>([]);
  disabled = input<boolean>(false);

  itemSelected = output<TItem>();
  itemDeselected = output<TItem>();

  readonly filterValue = signal('');
  readonly showOnlySelected = signal(false);
  readonly pageIndex = signal(0);
  readonly currentPageSize = signal(20);

  private readonly selectedSet = computed(() => new Set(this.selectedValues()));
  private readonly immutableSet = computed(() => new Set(this.immutableItems()));

  readonly filteredItems = computed(() => {
    const filter = this.filterValue().toLowerCase();
    const onlySelected = this.showOnlySelected();
    const selected = this.selectedSet();
    const immutable = this.immutableSet();
    const idField = this.keyField();

    return this.items().filter(item => {
      if (onlySelected && !selected.has(item[idField]) && !immutable.has(item[idField])) return false;
      if (filter) {
        return Object.values(item).some(v => String(v).toLowerCase().includes(filter));
      }
      return true;
    });
  });

  readonly pagedItems = computed(() => {
    const items = this.filteredItems();
    if (!this.paginate()) return items;
    const size = this.currentPageSize();
    const start = this.pageIndex() * size;
    return items.slice(start, start + size);
  });

  constructor() {
    effect(() => {
      this.currentPageSize.set(this.pageSize());
      this.pageIndex.set(0);
    });
    effect(() => {
      this.filterValue();
      this.showOnlySelected();
      untracked(() => this.pageIndex.set(0));
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  isSelected(item: TItem): boolean {
    return this.selectedSet().has(item[this.keyField()]);
  }

  isImmutable(item: TItem): boolean {
    return this.immutableSet().has(item[this.keyField()]);
  }

  trackItem = (_index: number, item: TItem): any => item[this.keyField()];

  toggle(item: TItem, checked: boolean): void {
    if (this.disabled()) return;
    const id = item[this.keyField()];
    if (checked) {
      this.selectedValues.update(current => [...current, id]);
      this.itemSelected.emit(item);
    } else {
      this.selectedValues.update(current => current.filter(v => v !== id));
      this.itemDeselected.emit(item);
    }
  }
}
