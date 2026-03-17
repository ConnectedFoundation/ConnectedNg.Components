import { FormFieldInterceptorContext } from "@connected-ng/components/forms";

export function hideField(fieldName: string) {
  return (context: FormFieldInterceptorContext) => {
    if (context.property.name?.toLowerCase() === fieldName) {
      return { skip: true };
    }
    return undefined;
  }
}
