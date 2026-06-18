import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MtxCalendarView,
  MtxDatetimepickerMode,
  MtxDatetimepickerModule,
  MtxDatetimepickerType,
} from '@ng-matero/extensions/datetimepicker';
import { FormInputConfig } from './form-input-config';
import { MatButtonModule } from '@angular/material/button';

const KNOWN_ERROR_KEYS = new Set(['required', 'minlength', 'maxlength', 'min', 'max', 'email']);

@Component({
  selector: 'dynamic-form-field',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MtxDatetimepickerModule,
    MatButtonModule
  ],
  templateUrl: './dynamic-form-field.component.html',
  styleUrl: './dynamic-form-field.component.scss'
})

export class DynamicFormFieldComponent {
  fieldConfig = input.required<FormInputConfig>();
  control = input.required<FormControl>();

  customErrors = computed(() => {
    const errors = this.control().errors;
    if (!errors) return [];
    return Object.entries(errors)
      .filter(([key, value]) => !KNOWN_ERROR_KEYS.has(key) && typeof value === 'string')
      .map(([, value]) => value as string);
  });
}
