import { Component, computed, effect, input, signal, TemplateRef } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { List, ActionDescriptionWithAction } from '@connected-ng/components';

@Component({
  selector: 'cn-code-list-list',
  imports: [MatListModule, MatPaginatorModule, List],
  templateUrl: './code-list-list.html',
  styleUrl: './code-list-list.scss',
})
export class CodeListList<T> {
  items = input.required<T[]>();
  itemTemplate = input.required<TemplateRef<T>>();
  itemActionsTemplate = input<TemplateRef<T>>();
  codeListActions = input<ActionDescriptionWithAction[]>([]);
  paginate = input(false);
  pageSize = input(20);
  pageSizeOptions = input<number[]>([5, 10, 25]);
  hidePageSize = input(true);

  protected readonly pageIndex = signal(0);
  protected readonly currentPageSize = signal(20);

  protected readonly pagedItems = computed(() => {
    const items = this.items();

    if (!this.paginate()) {
      return items;
    }

    const size = this.currentPageSize();
    const start = this.pageIndex() * size;
    return items.slice(start, start + size);
  });

  private readonly syncPageSize = effect(() => {
    this.currentPageSize.set(this.pageSize());
    this.pageIndex.set(0);
  });

  private readonly clampPageIndex = effect(() => {
    const items = this.items();

    if (!this.paginate()) {
      this.pageIndex.set(0);
      return;
    }

    const size = this.currentPageSize();
    if (size <= 0) {
      this.pageIndex.set(0);
      return;
    }

    const maxPage = Math.max(0, Math.ceil(items.length / size) - 1);
    if (this.pageIndex() > maxPage) {
      this.pageIndex.set(maxPage);
    }
  });

  protected onPageChange(event: PageEvent) {
    this.currentPageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
