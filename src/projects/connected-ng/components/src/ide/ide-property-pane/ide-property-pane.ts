import { Component, computed, effect, inject, Inject, OnDestroy, OnInit, Optional, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatOptionModule } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { IdeEditorPropertyService } from '../services/editor-property-service';
import { SelectionService, SelectedItem } from '../services/selection-service';
import { IEditorItemProperty } from '../services/dtos/editor-item-property';
import { PROPERTY_EDITOR_RULES, PropertyEditorRule, PropertyEditorType } from './property-editor-rules';

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
    MatSlideToggleModule,
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

  /** Flattened, ordered list of all registered rules (earlier registrations win). */
  private readonly rules: PropertyEditorRule[];

  constructor(@Optional() @Inject(PROPERTY_EDITOR_RULES) ruleGroups: PropertyEditorRule[][] | null) {
    this.rules = ruleGroups ? ruleGroups.flat() : [];
  }
  /** Separate subscription group for form controls — cleared on every loadProperties call. */
  private formSubscriptions = new Subscription();

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
    this.formSubscriptions.unsubscribe();
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
        this.initializePropertyForms(properties, selectedItem);
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
    return `${item.id}`;
  }

  private initializePropertyForms(properties: IEditorItemProperty[], selectedItem: SelectedItem) {
    // Tear down subscriptions from the previous load before creating new ones.
    this.formSubscriptions.unsubscribe();
    this.formSubscriptions = new Subscription();

    const forms = new Map<string, FormControl>();

    properties.forEach(prop => {
      const editorType = this.getPropertyEditor(prop);
      let initialValue: any = prop.value ?? '';
      if (editorType === 'checkbox') {
        initialValue = initialValue === true || String(initialValue).toLowerCase() === 'true';
      } else if (editorType === 'number') {
        initialValue = initialValue !== '' ? Number(initialValue) : '';
      }
      const control = new FormControl(
        { value: initialValue, disabled: prop.isReadOnly },
        { updateOn: 'blur' }
      );

      // Capture selectedItem at subscription setup time so it is still correct
      // when the save fires — even if the global selection has changed by then.
      // No debounce: with updateOn:'blur' the control emits exactly once per blur,
      // so the save must fire immediately before any subsequent click can alter state.
      this.formSubscriptions.add(
        control.valueChanges.subscribe(value =>
          this.onPropertyChanged(selectedItem, prop, value)
        )
      );

      forms.set(prop.name, control);
    });

    this.propertyEditorForms.set(forms);
  }

  private onPropertyChanged(selectedItem: SelectedItem, property: IEditorItemProperty, newValue: any) {
    this.propertyService.update({
      iEditorItem: this.constructEditorItemIdentifier(selectedItem),
      name: property.name,
      value: String(newValue ?? '')
    }).subscribe({
      next: (updated) => {
        if (updated) this.updateLocalProperty(property.name, updated);
      },
      error: (error) => {
        console.error('Failed to update property:', error);
        this.errorMessage.set(`Failed to update property: ${property.name}`);
      }
    });
  }

  private updateLocalProperty(name: string, updated: IEditorItemProperty) {
    if (!updated) return;
    const props = this.properties();
    const index = props.findIndex(p => p.name === name);
    if (index >= 0) {
      const newProps = [...props];
      newProps[index] = updated;
      this.properties.set(newProps);
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

  protected getPropertyLabel(property: IEditorItemProperty): string {
    const rule = this.findRule(property);
    return rule?.label ?? property.name;
  }

  protected getPropertyEditor(property: IEditorItemProperty): PropertyEditorType {
    // 1. Check registered rules first
    const rule = this.findRule(property);
    if (rule) return rule.editor;

    // 2. Fall back to value sent by the server
    if (property.editor) {
      return this.resolveEditorString(property.editor.split(':')[0]);
    }

    // 3. Infer from CLR type name
    return this.inferEditorFromType(property.propertyType);
  }

  private findRule(property: IEditorItemProperty): PropertyEditorRule | undefined {
    return this.rules.find(rule => {
      if (rule.name !== undefined && rule.name !== property.name) return false;
      if (rule.propertyType !== undefined && rule.propertyType !== property.propertyType) return false;
      return true;
    });
  }

  private resolveEditorString(value: string): PropertyEditorType {
    switch (value.toLowerCase()) {
      case 'int':
      case 'integer':
      case 'number':
        return 'number';
      case 'bool':
      case 'boolean':
        return 'checkbox';
      case 'dropdown':
      case 'select':
        return 'dropdown';
      default:
        return 'text';
    }
  }

  private inferEditorFromType(propertyType: string): PropertyEditorType {
    switch (propertyType) {
      case 'System.Boolean':
        return 'checkbox';
      case 'System.Int16':
      case 'System.Int32':
      case 'System.Int64':
      case 'System.UInt16':
      case 'System.UInt32':
      case 'System.UInt64':
      case 'System.Single':
      case 'System.Double':
      case 'System.Decimal':
        return 'number';
      default:
        return 'text';
    }
  }

  protected trackByPropertyName(index: number, property: IEditorItemProperty): string {
    return property?.name ?? String(index);
  }

  trackByCategory(index: number, entry: [string, IEditorItemProperty[]]): string {
    return entry[0];
  }
}
