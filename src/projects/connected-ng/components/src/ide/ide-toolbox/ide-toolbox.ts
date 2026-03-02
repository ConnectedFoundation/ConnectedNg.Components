import { Component, computed, effect, inject, input, OnDestroy, OnInit, output, signal, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { IdeDocument, IdeDocumentService } from '../services/document-service';
import { IdeToolboxItemService, IdeToolboxItem as ServiceToolboxItem } from '../services/toolbox-item-service';

export interface IdeToolboxItem {
  id: string;
  title: string;
  icon?: string;
  data?: any;
}

@Component({
  selector: 'cf-ide-toolbox',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './ide-toolbox.html',
  styleUrl: './ide-toolbox.scss',
})
export class IdeToolbox<T extends IdeToolboxItem = IdeToolboxItem> implements OnInit, OnDestroy {
  // If items input is provided, use those (presentational mode)
  // If items input is not provided, query from service (standalone mode)
  items = input<T[]>();
  searchPlaceholder = input<string>('Search...');
  itemTemplate = input<TemplateRef<{ $implicit: T }>>();
  filterFn = input<(item: T, searchText: string) => boolean>();
  sortFn = input<(a: T, b: T) => number>();

  itemSelected = output<T>();
  noItemsAvailable = output<void>();

  private documentService = inject(IdeDocumentService, { optional: true });
  private toolboxItemService = inject(IdeToolboxItemService, { optional: true });
  private subscriptions = new Subscription();

  private internalItems = signal<T[]>([]);
  searchText = signal<string>('');

  // Use provided items input or internal items loaded from service
  private effectiveItems = computed(() => {
    const providedItems = this.items();
    if (providedItems !== undefined) {
      return providedItems;
    }
    return this.internalItems();
  });

  // Check if there are any items at all
  hasItems = computed(() => this.effectiveItems().length > 0);

  // Check if search is active
  hasSearchText = computed(() => this.searchText().trim().length > 0);

  filteredItems = computed(() => {
    const search = this.searchText().toLowerCase();
    const items = this.effectiveItems();

    // Apply custom filter or default title filter
    let filtered = items;
    if (search) {
      const customFilter = this.filterFn();
      if (customFilter) {
        filtered = items.filter(item => customFilter(item, search));
      } else {
        filtered = items.filter(item =>
          item.title.toLowerCase().includes(search)
        );
      }
    }

    // Apply custom sort or default title sort
    const customSort = this.sortFn();
    if (customSort) {
      return [...filtered].sort(customSort);
    }

    return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  });

  constructor() {
    // Track hasItems changes and notify state service
    effect(() => {
      const hasItems = this.hasItems();
    });
  }

  ngOnInit() {
    // Only set up standalone mode if items input is not provided
    if (this.items() === undefined) {
      this.initializeStandaloneMode();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeStandaloneMode() {
    // Subscribe to document activation events
    if (this.documentService?.$activated) {
      this.subscriptions.add(
        this.documentService.$activated.subscribe(document => {
          this.loadToolboxItems(document);
        })
      );
    }

    // Load items for current active document if available
    const activeDoc = this.documentService?.activeDocument;
    if (activeDoc) {
      this.loadToolboxItems(activeDoc);
    }
  }
  //TODO map appropriate type to subject
  private loadToolboxItems(document: any) {
    if (!this.toolboxItemService) {
      return;
    }

    this.toolboxItemService.query({
      document: document.id,
      project: document.project,
      editor: '' //TODO wire up editor from IdeEditor
    }).subscribe(serviceItems => {
      // Convert service items to toolbox items
      const toolboxItems = serviceItems.map(item => ({
        id: item.key,
        title: item.name,
        icon: undefined,
        data: item
      } as T));

      this.internalItems.set(toolboxItems);

      // Notify parent if no items are available
      if (toolboxItems.length === 0) {
        this.noItemsAvailable.emit();
      }
    });
  }

  onSearchChange(value: string) {
    this.searchText.set(value);
  }

  onItemClick(item: T) {
    this.itemSelected.emit(item);
  }

  trackByFn(index: number, item: T): string {
    return item.id;
  }
}
