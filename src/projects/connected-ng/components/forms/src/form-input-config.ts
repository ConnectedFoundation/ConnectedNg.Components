export interface FormInputConfig {
  propertyName: string;
  label: string;
  inputType: 'text' | 'password' | 'email' | 'number' | 'date' | 'datetime-local' | 'checkbox' | 'textarea';
  dataType?: string;
  placeholder?: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  description?: string;
}
