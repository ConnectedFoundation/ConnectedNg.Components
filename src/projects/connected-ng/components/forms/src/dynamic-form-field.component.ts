import { Component, input } from '@angular/core';
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
}
