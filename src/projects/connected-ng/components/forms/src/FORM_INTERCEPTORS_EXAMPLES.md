# Form Generation Interceptors - Usage Examples

## Overview

Form interceptors allow you to customize form generation from DTO descriptors without modifying the base component.

**📘 Looking to inject custom components with your own logic?**
See [CUSTOM_COMPONENT_INTERCEPTORS.md](./CUSTOM_COMPONENT_INTERCEPTORS.md) for complete examples of replacing form fields with custom components (autocomplete, file upload, date range pickers, etc.)

---

## Example 1: Hide/Remove a Field

```typescript
const interceptors: FormGenerationInterceptors = {
  fieldInterceptors: [
    (context) => {
      // Hide the 'id' field
      if (context.property.name === 'id') {
        return { skip: true };
      }
    }
  ]
};

<cn-code-list-insert-form
  [serviceOperation]="service.insert"
  [formInterceptors]="interceptors"
/>
```

## Example 2: Modify Field Configuration

```typescript
const interceptors: FormGenerationInterceptors = {
  fieldInterceptors: [
    (context) => {
      // Make 'email' field use custom placeholder
      if (context.property.name === 'email') {
        return {
          fieldMetadata: {
            ...context.fieldMetadata!,
            inputs: {
              ...context.fieldMetadata!.inputs,
              fieldConfig: {
                ...context.fieldMetadata!.inputs.fieldConfig,
                placeholder: 'Enter your email address',
              },
            },
          },
        };
      }
    },
  ],
};
```

## Example 3: Replace Control with Custom Validators

```typescript
import { FormControl, Validators } from '@angular/forms';

const interceptors: FormGenerationInterceptors = {
  fieldInterceptors: [
    (context) => {
      // Add custom validator to 'vehicle code' field
      if (context.property.name === 'vehicleCode') {
        const customControl = new FormControl(context.control.value, [
          Validators.required,
          Validators.pattern(/^[A-Z]{3}-\d{4}$/),
        ]);
        return { control: customControl };
      }
    },
  ],
};
```

## Example 4: Add Additional Fields

```typescript
const interceptors: FormGenerationInterceptors = {
  additionalFields: [
    {
      component: DynamicFormFieldComponent,
      inputs: {
        fieldConfig: {
          propertyName: 'customField',
          label: 'Custom Field',
          inputType: 'text',
          required: false,
        },
        control: new FormControl(''),
      },
    },
  ],
};
```

## Example 5: Multiple Interceptors

```typescript
const interceptors: FormGenerationInterceptors = {
  fieldInterceptors: [
    // Hide sensitive fields
    (context) => {
      if (context.property.name === 'password') {
        return { skip: true };
      }
    },
    // Make all fields uppercase
    (context) => {
      if (context.fieldMetadata?.inputs.fieldConfig.inputType === 'text') {
        const newControl = new FormControl(context.control.value, context.control.validator);
        newControl.valueChanges.subscribe((val) => {
          if (val && typeof val === 'string') {
            newControl.setValue(val.toUpperCase(), { emitEvent: false });
          }
        });
        return { control: newControl };
      }
    },
  ],
  additionalFields: [
    // Add confirmation checkbox
    {
      component: DynamicFormFieldComponent,
      inputs: {
        fieldConfig: {
          propertyName: 'confirmTerms',
          label: 'I agree to terms',
          inputType: 'checkbox',
          required: true,
        },
        control: new FormControl(false, Validators.requiredTrue),
      },
    },
  ],
  afterGeneration: (metadata) => {
    console.log('Form generated with', metadata.fields.length, 'fields');
  },
};
```

## Example 6: Component with Interceptors (Composition)

```typescript
import { Component, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { CodeListInsertForm, FormGenerationInterceptors } from '@connected-ng/components';
import { VehicleService } from '../services/vehicle-service';

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
        // Vehicle-specific customizations
        if (context.property.name === 'vehicleCode') {
          return {
            control: new FormControl(context.control.value, [
              Validators.required,
              Validators.pattern(/^V-\d{4}$/),
            ]),
          };
        }
      },
    ],
  };
}
```

## API Reference

### FormGenerationInterceptors

```typescript
interface FormGenerationInterceptors {
  fieldInterceptors?: FormFieldInterceptor[];
  additionalFields?: DynamicComponentMetadata[];
  afterGeneration?: (metadata: DynamicFormMetadata) => void;
}
```

### FormFieldInterceptor

```typescript
type FormFieldInterceptor = (
  context: FormFieldInterceptorContext,
) => FormFieldInterceptorResult | void;

interface FormFieldInterceptorContext {
  property: DtoPropertyDescriptor;
  fieldMetadata: DynamicComponentMetadata | null;
  control: FormControl;
  formGroup: FormGroup;
}

interface FormFieldInterceptorResult {
  skip?: boolean; // Remove field from form
  fieldMetadata?: DynamicComponentMetadata; // Replace field configuration
  control?: FormControl; // Replace form control
}
```
