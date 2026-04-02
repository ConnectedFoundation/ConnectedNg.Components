import { Component, inject, output, Type } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DtoDescriptor, DtoPropertyDescriptor } from '@connected-ng/core';
import { DynamicFormFieldComponent } from './dynamic-form-field.component';
import { FormInputConfig } from './form-input-config';

@Component({ template: '' })
export abstract class FormBase<TModel> {
  protected formBuilder = inject(FormBuilder);
  validityChange = output<boolean>();
  formConfirm = output<TModel>();
  formClose = output<FormResult>();

  form?: FormGroup;
  abstract getModel(): TModel;

  onSubmit(): void {
    if (this.form?.valid) {
      this.formConfirm.emit(this.getModel());
    }
  }

  onError(error: any): void {
    console.error(error);
  }

  onClose(result: FormResult = { success: false }): void {
    this.formClose.emit(result);
  }

  ngOnInit(): void {
    this.form?.statusChanges.subscribe(() => {
      this.validityChange.emit(this.form?.valid ?? false);
    });
  }
}

export class FormResult {
  success: boolean = false;
  result?: any;
}

/**
 * Gets a property value from a DTO object. If the exact property name is not found,
 * performs a case-insensitive search.
 */
function getDtoPropertyValue(dto: any, propertyName: string): any {
  if (!dto || !propertyName) return null;

  // Try exact match first
  if (propertyName in dto) {
    return dto[propertyName];
  }

  // Try case-insensitive search
  const lowerPropertyName = propertyName.toLowerCase();
  const matchingKey = Object.keys(dto).find(
    key => key.toLowerCase() === lowerPropertyName
  );

  return matchingKey ? dto[matchingKey] : null;
}

export function createFormFromDtoDescriptor(dto: any, dtoDescriptor: DtoDescriptor): FormGroup {
  const controls: { [key: string]: FormControl } = {};

  dtoDescriptor.properties.forEach((property: DtoPropertyDescriptor) => {
    const propertyName = property.name ?? '';
    const value = getDtoPropertyValue(dto, propertyName) ?? null;
    const validators = [];

    // Add required validator
    if (property.required?.isRequired) {
      validators.push(Validators.required);
    }

    // Add minLength validator
    if (property.minLength?.value != null) {
      validators.push(Validators.minLength(property.minLength.value));
    }

    // Add maxLength validator
    if (property.maxLength?.value != null) {
      validators.push(Validators.maxLength(property.maxLength.value));
    }

    // Add min validator
    if (property.minValue?.value != null) {
      validators.push(Validators.min(property.minValue.value));
    }

    // Add max validator
    if (property.maxValue?.value != null) {
      validators.push(Validators.max(property.maxValue.value));
    }

    // Add email validator
    if (property.email?.isEnabled) {
      validators.push(Validators.email);
    }

    controls[propertyName] = new FormControl(value, validators);
  });

  return new FormGroup(controls);
}

/**
 * Generic metadata for dynamic form field components.
 * Can be used with any custom component, not just DynamicFormFieldComponent.
 *
 * @example
 * // Using a custom autocomplete component
 * {
 *   component: CustomerAutocomplete,
 *   inputs: {
 *     control: myFormControl,
 *     label: 'Customer',
 *     options: customersArray
 *   }
 * }
 */
export interface DynamicComponentMetadata<TComponent = any> {
  component: Type<TComponent>;
  fieldName: string;
  control: FormControl;
  fieldConfig: FormInputConfig,
  inputs: any;
}

/**
 * Standard form field metadata for the default DynamicFormFieldComponent.
 * Use this when working with the standard form field component.
 */
export interface StandardFormFieldMetadata extends DynamicComponentMetadata<DynamicFormFieldComponent> {
  inputs: {
    fieldConfig: FormInputConfig;
    control: FormControl;
  };
}

export function createFormInputFromDtoProperty(
  property: DtoPropertyDescriptor,
  control: FormControl
): StandardFormFieldMetadata {
  const propertyName = property.name ?? '';
  const label = property.text ?? property.name ?? '';
  const required = property.required?.isRequired ?? false;
  const description = property.description;

  let inputType: FormInputConfig['inputType'] = 'text';

  // Determine input type based on property characteristics
  if (property.isPassword) {
    inputType = 'password';
  } else if (property.email?.isEnabled) {
    inputType = 'email';
  } else if (property.type === 'number') {
    inputType = 'number';
  } else if (property.type === 'datetime') {
    inputType = 'datetime-local';
  } else if (property.type === 'date') {
    inputType = 'date';
  } else if (property.type === 'bool') {
    inputType = 'checkbox';
  } else if (property.maxLength && property.maxLength.value && property.maxLength.value > 255) {
    inputType = 'textarea';
  } else {
    inputType = 'text';
  }

  const config: FormInputConfig = {
    propertyName,
    label,
    inputType,
    dataType: property.type,
    required,
    description
  };

  // Add validation constraints
  if (property.minLength?.value != null) {
    config.minLength = property.minLength.value;
  }

  if (property.maxLength?.value != null) {
    config.maxLength = property.maxLength.value;
  }

  if (property.minValue?.value != null) {
    config.min = property.minValue.value;
  }

  if (property.maxValue?.value != null) {
    config.max = property.maxValue.value;
  }

  return {
    component: DynamicFormFieldComponent,
    fieldName: propertyName,
    control: control,
    fieldConfig: config,
    inputs: {
      fieldConfig: config,
      control: control
    }
  };
}

export interface DynamicFormMetadata {
  formGroup: FormGroup;
  fields: DynamicComponentMetadata[];
}

export interface FormFieldInterceptorContext {
  property: DtoPropertyDescriptor;
  fieldMetadata: DynamicComponentMetadata;
  control: FormControl;
  formGroup: FormGroup;
}

export interface FormFieldInterceptorResult {
  /** If true, the field will be skipped/removed from the form */
  skip?: boolean;
  /**
   * Modified field metadata. If provided, replaces the default.
   * You can inject ANY custom component here with its own logic and UI.
   *
   * @example
   * // Replace with custom autocomplete component
   * {
   *   fieldMetadata: {
   *     component: CustomerAutocomplete,
   *     inputs: {
   *       control: context.control,
   *       label: 'Customer',
   *       searchService: myService
   *     }
   *   }
   * }
   */
  fieldMetadata?: DynamicComponentMetadata;
  /** Modified control. If provided, replaces the control in the form group */
  control?: FormControl;
}

export type FormFieldInterceptor = (context: FormFieldInterceptorContext) => FormFieldInterceptorResult | void;

/**
 * Configuration for intercepting and customizing form generation.
 * Use this to inject custom components, modify fields, or add additional logic.
 *
 * See CUSTOM_COMPONENT_INTERCEPTORS.md for detailed examples of injecting custom components.
 */
export interface FormGenerationInterceptors {
  /** Interceptors applied to each field during generation. Use to replace components or modify configuration. */
  fieldInterceptors?: FormFieldInterceptor[];
  /** Additional fields to add that are not in the DTO descriptor */
  additionalFields?: DynamicComponentMetadata[];
  /** Callback invoked after form generation is complete */
  afterGeneration?: (metadata: DynamicFormMetadata) => void;
}

export function generateFormFromDtoDescriptor(
  dto: any,
  dtoDescriptor: DtoDescriptor,
  interceptors?: FormGenerationInterceptors
): DynamicFormMetadata {
  const formGroup = createFormFromDtoDescriptor(dto, dtoDescriptor);
  const fields: DynamicComponentMetadata[] = [];

  dtoDescriptor.properties.forEach((property: DtoPropertyDescriptor) => {
    const propertyName = property.name ?? '';
    let control = formGroup.get(propertyName) as FormControl;

    if (!control) return;

    let fieldMetadata: DynamicComponentMetadata | null = createFormInputFromDtoProperty(property, control);
    let shouldSkip = false;

    // Apply field interceptors
    if (interceptors?.fieldInterceptors) {
      for (const interceptor of interceptors.fieldInterceptors) {
        const result = interceptor({
          property,
          fieldMetadata,
          control,
          formGroup
        });

        if (result) {
          if (result.skip) {
            shouldSkip = true;
            break;
          }

          if (result.fieldMetadata) {
            fieldMetadata = result.fieldMetadata;
          }

          if (result.control) {
            control = result.control;
            // Replace the control in the form group
            formGroup.setControl(propertyName, control);
          }
        }
      }
    }

    if (!shouldSkip && fieldMetadata) {
      fields.push(fieldMetadata);
    }
  });

  // Add any additional fields
  if (interceptors?.additionalFields) {
    fields.push(...interceptors.additionalFields);
  }

  const metadata: DynamicFormMetadata = {
    formGroup,
    fields
  };

  // Call after generation callback
  if (interceptors?.afterGeneration) {
    interceptors.afterGeneration(metadata);
  }

  return metadata;
}
