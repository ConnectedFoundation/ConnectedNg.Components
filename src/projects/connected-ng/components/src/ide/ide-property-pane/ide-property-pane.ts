import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatOptionModule } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { IdeEditorPropertyService } from '../services/editor-property-service';
import { SelectionService, SelectedItem } from '../services/selection-service';
import { IEditorItemProperty } from '../services/dtos/editor-item-property';

@Component({
  selector: 'cf-ide-property-pane',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './ide-property-pane.html',
  styleUrl: './ide-property-pane.scss',
})
export class IdePropertyPane implements OnInit, OnDestroy {
  private propertyService = inject(IdeEditorPropertyService);
  private selectionService = inject(SelectionService);
  private subscriptions = new Subscription();

  protected properties = signal<IEditorItemProperty[]>([]);
  private selectedItem = signal<SelectedItem | null>(null);
  private lastLoadedItemKey = signal<string | null>(null);
  private propertyEditorForms = signal<Map<string, FormControl>>(new Map());
  protected isLoading = signal<boolean>(false);
  protected errorMessage = signal<string | null>(null);

  // Computed properties
  protected hasProperties = computed(() => this.properties().length > 0);
  protected hasSelectedItem = computed(() => !!this.selectedItem());
  private groupedProperties = computed(() => this.groupPropertiesByCategory());

  ngOnInit() {
    this.initializeSelectionTracking();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeSelectionTracking() {
    if (this.selectionService?.$selected) {
      this.subscriptions.add(
        this.selectionService.$selected.subscribe(selected => {
          this.onSelectionChanged(selected);
        })
      );
    }
  }

  private onSelectionChanged(selectedItem: SelectedItem) {
    // Create a unique key for this selection
    const itemKey = `${selectedItem.type}/${selectedItem.id}/${selectedItem.currentEditor || ''}`;

    // Only load if this is a different item than last time
    if (this.lastLoadedItemKey() === itemKey) {
      return;
    }

    this.lastLoadedItemKey.set(itemKey);
    this.selectedItem.set(selectedItem);
    this.loadProperties(selectedItem);
  }

  private loadProperties(selectedItem: SelectedItem) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Construct the full IEditorItem identifier
    const iEditorItem = this.constructEditorItemIdentifier(selectedItem);

    this.propertyService.query({
      iEditorItem,
      context: selectedItem.context,
      editor: selectedItem.currentEditor
    }).subscribe({
      next: (properties) => {
        this.properties.set(properties);
        this.initializePropertyForms(properties);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load properties:', error);
        this.errorMessage.set('Failed to load properties');
        this.isLoading.set(false);
      }
    });
  }

  private constructEditorItemIdentifier(item: SelectedItem): string {
    // Construct the identifier based on type and context
    // Format: "TypeFullName/ItemId" or similar depending on backend expectations
    return `${item.type}/${item.id}`;
  }

  private initializePropertyForms(properties: IEditorItemProperty[]) {
    const forms = new Map<string, FormControl>();

    properties.forEach(prop => {
      const control = new FormControl(
        { value: prop.value || '', disabled: prop.isReadOnly },
        { updateOn: 'blur' }
      );

      // Subscribe to changes with debounce
      this.subscriptions.add(
        control.valueChanges
          .pipe(debounceTime(300))
          .subscribe(value => this.onPropertyChanged(prop, value))
      );

      forms.set(prop.name, control);
    });

    this.propertyEditorForms.set(forms);
  }

  private onPropertyChanged(property: IEditorItemProperty, newValue: any) {
    const selectedItem = this.selectedItem();
    if (!selectedItem) return;

    // Update the property via the service
    this.propertyService.update({
      iEditorItem: this.constructEditorItemIdentifier(selectedItem),
      name: property.name,
      value: String(newValue)
    }).subscribe({
      next: (updated) => {
        // Optionally update the local property
        this.updateLocalProperty(property.name, updated);
      },
      error: (error) => {
        console.error('Failed to update property:', error);
        this.errorMessage.set(`Failed to update property: ${property.name}`);
      }
    });
  }

  private updateLocalProperty(name: string, updated: IEditorItemProperty) {
    const props = this.properties();
    const index = props.findIndex(p => p.name === name);
    if (index >= 0) {
      props[index] = updated;
      this.properties.set([...props]);
    }
  }

  private groupPropertiesByCategory(): Map<string, IEditorItemProperty[]> {
    const groups = new Map<string, IEditorItemProperty[]>();

    this.properties().forEach(prop => {
      // Extract category from editor type or use 'General'
      const category = this.extractCategory(prop);
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(prop);
    });

    return groups;
  }

  private extractCategory(property: IEditorItemProperty): string {
    if (property.editor?.includes(':')) {
      return property.editor.split(':')[0];
    }
    return 'General';
  }

  getPropertyControl(propertyName: string): FormControl {
    const control = this.propertyEditorForms().get(propertyName);
    if (!control) {
      // Return a default disabled control if not found
      return new FormControl({ value: '', disabled: true });
    }
    return control;
  }

  protected getPropertyEditor(property: IEditorItemProperty): 'text' | 'number' | 'checkbox' | 'dropdown' {
    if (!property.editor) return 'text';

    const editor = property.editor.split(':')[0];
    switch (editor.toLowerCase()) {
      case 'integer':
      case 'number':
        return 'number';
      case 'boolean':
        return 'checkbox';
      case 'dropdown':
      case 'select':
        return 'dropdown';
      default:
        return 'text';
    }
  }

  protected trackByPropertyName(index: number, property: IEditorItemProperty): string {
    return property.name;
  }

  trackByCategory(index: number, entry: [string, IEditorItemProperty[]]): string {
    return entry[0];
  }
}