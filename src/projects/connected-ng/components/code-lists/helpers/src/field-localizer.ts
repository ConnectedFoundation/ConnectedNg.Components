import { FormFieldInterceptorContext } from "@connected-ng/components/forms";

export type FieldLocalizeFunction = (fieldName: string) => string;

export function localizeFields(labelMap: Record<string, FieldLocalizeFunction>) {
  return (context: FormFieldInterceptorContext) => {

    const fieldName = context.property.name?.toLowerCase();

    if (fieldName && labelMap[fieldName]) {
      return {
        fieldMetadata: {
          ...context.fieldMetadata!,
          inputs: {
            ...context.fieldMetadata!.inputs,
            fieldConfig: {
              ...context.fieldMetadata!.inputs.fieldConfig,
              label: labelMap[fieldName](fieldName)
            }
          }
        }
      };
    }

    return undefined;
  }
}
