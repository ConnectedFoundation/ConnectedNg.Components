# Injecting Custom Components with Form Interceptors

## Overview

Form interceptors allow you to completely replace the default form field component with your own custom component that has its own logic, UI, and behavior. This is useful when you need more than just configuration changes.

## Creating a Custom Form Component

Your custom component should:

1. Accept a `FormControl` as an input
2. Be a standalone Angular component
3. Handle its own UI logic and interactions

## Example 1: Custom Vehicle Code Selector

```typescript
import { Component, input, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vehicle-code-selector',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="custom-vehicle-selector">
      <label>{{ label() }}</label>
      <select
        [formControl]="control()"
        class="form-select"
      >
        <option value="">Select Vehicle Code</option>
        @for (code of vehicleCodes(); track code) {
          <option [value]="code">{{ code }}</option>
        }
      </select>
      <button
        type="button"
        (click)="generateCode()"
        class="btn-generate"
      >
        Auto Generate
      </button>
      @if (control().hasError('required') && control().touched) {
        <span class="error">Vehicle code is required</span>
      }
    </div>
  `,
  styles: [
    `
      .custom-vehicle-selector {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .btn-generate {
        align-self: flex-start;
      }
    `,
  ],
})
export class VehicleCodeSelector {
  control = input.required<FormControl>();
  label = input<string>('Vehicle Code');

  vehicleCodes = signal(['V-001', 'V-002', 'V-003']);

  generateCode() {
    const randomCode = `V-${Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0')}`;
    this.control().setValue(randomCode);
    this.control().markAsTouched();
  }
}

// In your component:
@Component({
  selector: 'mom-vehicle-insert-form',
  standalone: true,
  imports: [CodeListInsertForm],
  template: `
    <cn-code-list-insert-form
      [serviceOperation]="service.insert"
      [formInterceptors]="interceptors"
      title="New Vehicle"
    />
  `,
})
export class VehicleInsertForm {
  service = inject(VehicleService);

  interceptors: FormGenerationInterceptors = {
    fieldInterceptors: [
      (context) => {
        // Replace the vehicleCode field with custom component
        if (context.property.name === 'vehicleCode') {
          return {
            fieldMetadata: {
              component: VehicleCodeSelector,
              inputs: {
                control: context.control,
                label: 'Vehicle Code',
              },
            },
          };
        }
      },
    ],
  };
}
```

## Example 2: Autocomplete with API Integration

```typescript
import { Component, input, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-customer-autocomplete',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="autocomplete-field">
      <label>{{ label() }}</label>
      <input
        type="text"
        [formControl]="searchControl"
        placeholder="Start typing to search..."
        class="form-input"
      />
      @if (isLoading()) {
        <div class="loading">Searching...</div>
      }
      @if (suggestions().length > 0) {
        <ul class="suggestions-list">
          @for (item of suggestions(); track item.id) {
            <li
              (click)="selectItem(item)"
              class="suggestion-item"
            >
              <strong>{{ item.name }}</strong>
              <small>{{ item.code }}</small>
            </li>
          }
        </ul>
      }
      @if (selectedItem()) {
        <div class="selected-item">
          Selected: {{ selectedItem()?.name }}
          <button
            type="button"
            (click)="clear()"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .autocomplete-field {
        position: relative;
      }
      .suggestions-list {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ccc;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
      }
      .suggestion-item {
        padding: 8px;
        cursor: pointer;
      }
      .suggestion-item:hover {
        background: #f0f0f0;
      }
    `,
  ],
})
export class CustomerAutocomplete {
  control = input.required<FormControl>();
  label = input<string>('Customer');

  customerService = inject(CustomerService);

  searchControl = new FormControl('');
  suggestions = signal<any[]>([]);
  selectedItem = signal<any>(null);
  isLoading = signal(false);

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        tap(() => this.isLoading.set(true)),
        switchMap((term) => {
          if (!term || term.length < 2) {
            return of([]);
          }
          return this.customerService.search(term);
        }),
      )
      .subscribe({
        next: (results) => {
          this.suggestions.set(results);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });

    // Initialize from existing value
    if (this.control().value) {
      this.loadCustomer(this.control().value);
    }
  }

  selectItem(item: any) {
    this.selectedItem.set(item);
    this.control().setValue(item.id);
    this.control().markAsTouched();
    this.suggestions.set([]);
    this.searchControl.setValue('');
  }

  clear() {
    this.selectedItem.set(null);
    this.control().setValue(null);
    this.searchControl.setValue('');
  }

  loadCustomer(id: string) {
    this.customerService.getById(id).subscribe((customer) => {
      this.selectedItem.set(customer);
    });
  }
}

// Usage:
interceptors: FormGenerationInterceptors = {
  fieldInterceptors: [
    (context) => {
      if (context.property.name === 'customerId') {
        return {
          fieldMetadata: {
            component: CustomerAutocomplete,
            inputs: {
              control: context.control,
              label: 'Customer',
            },
          },
        };
      }
    },
  ],
};
```

## Example 3: Date Range Picker

```typescript
@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="date-range-picker">
      <label>{{ label() }}</label>
      <div class="date-inputs">
        <input
          type="date"
          [formControl]="startControl"
          placeholder="Start Date"
        />
        <span class="separator">to</span>
        <input
          type="date"
          [formControl]="endControl"
          placeholder="End Date"
        />
      </div>
      @if (hasError()) {
        <span class="error">{{ errorMessage() }}</span>
      }
    </div>
  `,
})
export class DateRangePicker {
  control = input.required<FormControl>();
  label = input<string>('Date Range');

  startControl = new FormControl();
  endControl = new FormControl();

  hasError = computed(() => {
    return this.control().invalid && this.control().touched;
  });

  errorMessage = computed(() => {
    if (this.control().hasError('required')) {
      return 'Date range is required';
    }
    if (this.control().hasError('invalidRange')) {
      return 'End date must be after start date';
    }
    return '';
  });

  ngOnInit() {
    // Parse existing value
    const existingValue = this.control().value;
    if (existingValue) {
      this.startControl.setValue(existingValue.start);
      this.endControl.setValue(existingValue.end);
    }

    // Update main control when either date changes
    merge(this.startControl.valueChanges, this.endControl.valueChanges).subscribe(() => {
      this.updateMainControl();
    });
  }

  updateMainControl() {
    const start = this.startControl.value;
    const end = this.endControl.value;

    if (start && end) {
      if (new Date(start) > new Date(end)) {
        this.control().setErrors({ invalidRange: true });
      } else {
        this.control().setValue({ start, end });
        this.control().setErrors(null);
      }
    } else {
      this.control().setValue(null);
    }

    this.control().markAsTouched();
  }
}
```

## Example 4: File Upload Component

```typescript
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="file-upload">
      <label>{{ label() }}</label>
      <input
        type="file"
        #fileInput
        (change)="onFileSelected($event)"
        [accept]="acceptedTypes()"
        style="display: none"
      />
      <button
        type="button"
        (click)="fileInput.click()"
        class="upload-btn"
      >
        Choose File
      </button>
      @if (fileName()) {
        <div class="file-info">
          <span>{{ fileName() }}</span>
          <button
            type="button"
            (click)="removeFile()"
          >
            Remove
          </button>
        </div>
      }
      @if (isUploading()) {
        <div class="progress">
          <div
            class="progress-bar"
            [style.width.%]="uploadProgress()"
          ></div>
        </div>
      }
    </div>
  `,
})
export class FileUploadField {
  control = input.required<FormControl>();
  label = input<string>('Upload File');
  acceptedTypes = input<string>('*');

  uploadService = inject(FileUploadService);

  fileName = signal<string | null>(null);
  isUploading = signal(false);
  uploadProgress = signal(0);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName.set(file.name);
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    this.isUploading.set(true);

    this.uploadService.upload(file).subscribe({
      next: (event) => {
        if (event.type === 'progress') {
          this.uploadProgress.set(event.progress);
        } else if (event.type === 'complete') {
          this.control().setValue(event.fileUrl);
          this.isUploading.set(false);
          this.control().markAsTouched();
        }
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isUploading.set(false);
        this.control().setErrors({ uploadFailed: true });
      },
    });
  }

  removeFile() {
    this.fileName.set(null);
    this.control().setValue(null);
    this.uploadProgress.set(0);
  }
}
```

## Example 5: Multi-Select with Chips

```typescript
@Component({
  selector: 'app-multi-select-chips',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="multi-select">
      <label>{{ label() }}</label>
      <div class="selected-chips">
        @for (item of selectedItems(); track item.id) {
          <span class="chip">
            {{ item.name }}
            <button
              type="button"
              (click)="removeItem(item)"
            >
              ×
            </button>
          </span>
        }
      </div>
      <select
        [formControl]="selectControl"
        class="form-select"
      >
        <option value="">Add {{ label() }}...</option>
        @for (option of availableOptions(); track option.id) {
          <option [value]="option.id">{{ option.name }}</option>
        }
      </select>
    </div>
  `,
  styles: [
    `
      .selected-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: #e0e0e0;
        border-radius: 1rem;
      }
    `,
  ],
})
export class MultiSelectChips {
  control = input.required<FormControl>();
  label = input<string>('Items');
  options = input.required<any[]>();

  selectControl = new FormControl('');
  selectedItems = signal<any[]>([]);

  availableOptions = computed(() => {
    const selected = this.selectedItems();
    return this.options().filter((opt) => !selected.some((s) => s.id === opt.id));
  });

  ngOnInit() {
    // Initialize from existing value (array of IDs)
    const existingIds = this.control().value || [];
    const existing = this.options().filter((opt) => existingIds.includes(opt.id));
    this.selectedItems.set(existing);

    this.selectControl.valueChanges.subscribe((id) => {
      if (id) {
        const item = this.options().find((opt) => opt.id === id);
        if (item) {
          this.addItem(item);
        }
        this.selectControl.setValue('', { emitEvent: false });
      }
    });
  }

  addItem(item: any) {
    const current = this.selectedItems();
    this.selectedItems.set([...current, item]);
    this.updateControl();
  }

  removeItem(item: any) {
    const current = this.selectedItems();
    this.selectedItems.set(current.filter((i) => i.id !== item.id));
    this.updateControl();
  }

  updateControl() {
    const ids = this.selectedItems().map((item) => item.id);
    this.control().setValue(ids);
    this.control().markAsTouched();
  }
}

// Usage:
interceptors: FormGenerationInterceptors = {
  fieldInterceptors: [
    (context) => {
      if (context.property.name === 'categoryIds') {
        return {
          fieldMetadata: {
            component: MultiSelectChips,
            inputs: {
              control: context.control,
              label: 'Categories',
              options: this.availableCategories, // Pass data to component
            },
          },
        };
      }
    },
  ],
};
```

## Key Points

1. **Component Contract**: Custom components should accept at minimum:
   - `control: FormControl` - The form control to bind to
   - `label: string` (optional) - Display label

2. **Update the Control**: Always call `control().setValue()` and optionally `markAsTouched()` when the value changes

3. **Handle Validation**: Display errors using `control().hasError()` and `control().touched`

4. **Pass Additional Data**: You can pass any data to your custom component through the `inputs` object

5. **Standalone Components**: All custom components should be standalone for easier integration

## Complete Working Example

```typescript
@Component({
  selector: 'mom-vehicle-insert-form',
  standalone: true,
  imports: [CodeListInsertForm],
  template: `
    <cn-code-list-insert-form
      [serviceOperation]="service.insert"
      [formInterceptors]="interceptors"
      title="New Vehicle"
    />
  `,
})
export class VehicleInsertForm {
  service = inject(VehicleService);
  categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);

  ngOnInit() {
    this.categoryService.getAll().subscribe((cats) => {
      this.categories.set(cats);
    });
  }

  interceptors: FormGenerationInterceptors = {
    fieldInterceptors: [
      // Custom vehicle code selector
      (context) => {
        if (context.property.name === 'vehicleCode') {
          return {
            fieldMetadata: {
              component: VehicleCodeSelector,
              inputs: {
                control: context.control,
                label: 'Vehicle Code',
              },
            },
          };
        }
      },
      // Custom category multi-select
      (context) => {
        if (context.property.name === 'categoryIds') {
          return {
            fieldMetadata: {
              component: MultiSelectChips,
              inputs: {
                control: context.control,
                label: 'Categories',
                options: this.categories(),
              },
            },
          };
        }
      },
      // Hide internal fields
      (context) => {
        if (context.property.name === 'internalId') {
          return { skip: true };
        }
      },
    ],
  };
}
```
