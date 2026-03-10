import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({ template: '' })
export abstract class FormBase<TModel> {
  protected formBuilder = inject(FormBuilder);
  validityChange = output<boolean>();
  formConfirm = output<void>();

  abstract form: FormGroup;
  abstract getModel(): TModel;

  onSubmit(): void {
    if (this.form.valid) {
      this.formConfirm.emit();
    }
  }

  ngOnInit(): void {
    this.form.statusChanges.subscribe(() => {
      this.validityChange.emit(this.form.valid);
    });
  }
}
