import { Component, input, signal, computed, effect, Type, ViewContainerRef, viewChild, forwardRef, inject, TemplateRef, output, model, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocomplete } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBase, FormResult } from '@connected-ng/components/forms';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'cn-code-list-select-box',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './code-list-select-box.html',
  styleUrl: './code-list-select-box.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodeListSelectBox),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CodeListSelectBox),
      multi: true
    }
  ]
})
export class CodeListSelectBox<T = any> implements ControlValueAccessor, Validator, OnDestroy {
  // Services
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  // Inputs
  items = input.required<T[]>();
  addedItems = signal<T[]>([]);
  keySelector = input.required<(item: T) => any>();
  displayMemberSelector = input<(item: T) => string>((item: T) => String(item));
  placeholder = input<string>('Select an item');
  label = input<string>('');
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  showSelectionAsPlaceholder = input<boolean>(true);
  insertFormComponent = input<Type<FormBase<unknown>>>();
  insertFormResultMapper = input<((result: FormResult) => Promise<T | undefined>)>();
  insertFormInputs = input<any>({});
  insertFormTitle = input<string>('Add New Item');
  itemTemplate = input<TemplateRef<any>>();

  // Two-way binding support
  model = model<any>(null);

  // ViewChild for autocomplete panel
  autocomplete = viewChild<MatAutocomplete>('auto');

  // Form control for the input
  searchControl = new FormControl<string>('');

  // State
  selectedValue = signal<T | null>(null);
  filterText = signal<string>('');
  touched = signal<boolean>(false);
  private destroy$ = new Subject<void>();

  // Filtered options based on filter text
  filteredOptions = computed(() => {
    const items = [...this.items(), ...this.addedItems()];
    const filter = this.filterText().toLowerCase();

    if (!filter) {
      return items;
    }

    const display = this.displayMemberSelector();
    return items.filter(item =>
      display(item).toLowerCase().includes(filter)
    );
  });

  // Computed placeholder that shows selected value when showSelectionAsPlaceholder is true
  computedPlaceholder = computed(() => {
    if (this.showSelectionAsPlaceholder()) {
      const selected = this.selectedValue();
      if (selected) {
        return this.displayMemberSelector()(selected);
      }
    }
    return this.placeholder();
  });

  // ControlValueAccessor callbacks
  private _onChange: (value: any) => void = () => { };
  private _onTouched: () => void = () => { };

  constructor() {
    // Subscribe to search control value changes for filtering
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.filterText.set(value || '');
      });

    // Sync model input with internal state
    effect(() => {
      const modelValue = this.model();
      if (modelValue !== null && modelValue !== undefined) {
        const keySelector = this.keySelector();
        const item = this.items().find(item => keySelector(item) === modelValue);

        if (item && item !== this.selectedValue()) {
          this.selectedValue.set(item);
          this._updateDisplayValue();
        }
      } else if ((modelValue === null || modelValue === undefined) && this.selectedValue() !== null) {
        this.selectedValue.set(null);
        this.searchControl.setValue('', { emitEvent: false });
      }
    });

    // Handle disabled state
    effect(() => {
      if (this.disabled()) {
        this.searchControl.disable({ emitEvent: false });
      } else {
        this.searchControl.enable({ emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value === null || value === undefined) {
      this.selectedValue.set(null);
      this.searchControl.setValue('', { emitEvent: false });
      return;
    }

    const keySelector = this.keySelector();
    const item = this.items().find(item => keySelector(item) === value);

    if (item) {
      this.selectedValue.set(item);
      this._updateDisplayValue();
    }
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled via effect in constructor
  }

  // Validator implementation
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !this.selectedValue()) {
      return { required: true };
    }
    return null;
  }

  // Event handlers
  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const item = event.option.value as T;
    const key = this.keySelector()(item);
    const displayValue = this.displayMemberSelector()(item);

    // IMMEDIATELY show the new value in the input to prevent any visual blink
    // This hides the placeholder temporarily
    this.searchControl.setValue(displayValue, { emitEvent: false });

    // Now update signals
    this.selectedValue.set(item);
    this.filterText.set('');

    // Force change detection so placeholder updates with new value
    this.cdr.detectChanges();

    // Finally, move to placeholder mode if needed (now placeholder shows correct value)
    if (this.showSelectionAsPlaceholder()) {
      this.searchControl.setValue('', { emitEvent: false });
    }

    // Trigger model change and form callbacks
    this._onChange(key);
    this.model.set(key);
    this._markAsTouched();
  }

  onFocus(): void {
    // Clear search to show all options
    this.searchControl.setValue('', { emitEvent: true });
  }

  onBlur(): void {
    // Don't update display if autocomplete panel is still open
    // (user is in the process of selecting an option)
    const auto = this.autocomplete();
    if (auto?.isOpen) {
      return;
    }
    this._markAsTouched();
    this._updateDisplayValue();
  }

  private _updateDisplayValue(): void {
    const selected = this.selectedValue();

    // If showSelectionAsPlaceholder is enabled, keep input empty and show selection in placeholder
    if (this.showSelectionAsPlaceholder()) {
      this.searchControl.setValue('', { emitEvent: false });
      return;
    }

    // Otherwise, show the display value in the input field
    if (selected) {
      const displayValue = this.displayMemberSelector()(selected);
      this.searchControl.setValue(displayValue, { emitEvent: false });
    } else {
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  private _markAsTouched(): void {
    if (!this.touched()) {
      this.touched.set(true);
      this._onTouched();
    }
  }

  // Insert form dialog
  async openInsertDialog(): Promise<void> {
    if (this.disabled()) {
      return;
    }

    const formComponent = this.insertFormComponent();
    if (!formComponent) {
      console.warn('No insert form component provided');
      return;
    }

    const dialogRef = this.dialog.open(InsertFormDialogWrapper, {
      width: 'fit-content',
      data: {
        formComponent,
        formInputs: this.insertFormInputs(),
        title: this.insertFormTitle()
      }
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result.success) {
      const newItem = (await this.insertFormResultMapper()!(result as FormResult)) ?? undefined;

      if (newItem === undefined)
        return;

      this.addedItems.update((items) => {
        items.push(newItem!);
        return items;
      });

      setTimeout(() => {
        const mockEvent = {
          option: { value: newItem }
        } as MatAutocompleteSelectedEvent;
        this.onOptionSelected(mockEvent);
      }, 100);
    }
  }

  // Template helper
  trackByKey(index: number, item: T): any {
    return this.keySelector()(item);
  }
}

// Dialog wrapper component for the insert form
@Component({
  selector: 'cn-insert-form-dialog-wrapper',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>{{ data.title }}</h2>
    </div>
    <mat-dialog-content>
      <div #formContainer></div>
    </mat-dialog-content>
  `,
  styles: [`
    .dialog-header {
      margin-bottom: 16px;
      padding: 24px;
    }
  `]
})
export class InsertFormDialogWrapper<T> {
  data = inject<{ formComponent: Type<FormBase<T>>, formInputs: any, title: string }>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<InsertFormDialogWrapper<T>>);
  formContainer = viewChild<any, ViewContainerRef>('formContainer', { read: ViewContainerRef });


  ngAfterViewInit(): void {
    const container = this.formContainer();
    if (container) {
      const componentRef = container.createComponent(this.data.formComponent);

      // Set inputs
      Object.keys(this.data.formInputs).forEach(key => {
        (componentRef.instance as any)[key] = this.data.formInputs[key];
      });

      componentRef.instance.formClose.subscribe((result) => {
        this.dialogRef.close(result);
      });
    }
  }
}
