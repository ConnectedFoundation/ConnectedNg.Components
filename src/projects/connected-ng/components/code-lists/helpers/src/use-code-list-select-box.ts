import { Type } from "@angular/core";
import { FormFieldInterceptorContext } from "@connected-ng/components/forms";

export function useCodeListSelectBox(fieldName: string, component: Type<any>, componentInputs?: any) {
  return (context: FormFieldInterceptorContext) => {
    if (context.property.name?.toLowerCase() === fieldName) {
      return {
        fieldMetadata: {
          component: component,
          fieldName,
          control: context.control,
          fieldConfig: context.fieldMetadata!.fieldConfig,
          inputs: {
            control: context.control,
            ...componentInputs
          }
        },
        control: context.control
      };
    }

    return undefined;
  }
}
