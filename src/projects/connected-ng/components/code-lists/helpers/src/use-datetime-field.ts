import { FormFieldInterceptorContext } from "@connected-ng/components/forms";
import { DynamicFormFieldComponent } from "@connected-ng/components/forms";

/**
 * Field interceptor that forces a field to render as a datetime-local input.
 * Use this for DateTimeOffset fields that aren't automatically detected as datetime.
 *
 * @param fieldName - The property name (case-insensitive) to apply the datetime input to
 *
 * @example
 * fieldInterceptors: [
 *   useDateTimeField('from'),
 *   useDateTimeField('to'),
 * ]
 */
export function useDateTimeField(...fieldNames: string[]) {
  const lowerNames = fieldNames.map(f => f.toLowerCase());

  return (context: FormFieldInterceptorContext) => {
    if (!lowerNames.includes(context.property.name?.toLowerCase() ?? '')) {
      return undefined;
    }

    const existing = context.fieldMetadata as any;
    if (existing?.component === DynamicFormFieldComponent) {
      return {
        control: context.control,
        fieldMetadata: {
          fieldName: existing.fieldName,
          control: existing.control,
          fieldConfig: existing.fieldConfig,
          component: DynamicFormFieldComponent,
          inputs: {
            ...existing.inputs,
            fieldConfig: {
              ...existing.inputs.fieldConfig,
              inputType: 'datetime-local'
            }
          }
        }
      };
    }

    return undefined;
  };
}
