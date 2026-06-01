import { Component, input, signal, computed, Type, ViewContainerRef, viewChild, forwardRef, inject, TemplateRef, AfterViewInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { FormBase, FormResult } from '@connected-ng/components/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'cn-code-list-select-box',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MtxSelectModule
  ],
  templateUrl: './code-list-select-box.html',
  styleUrl: './code-list-select-box.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodeListSelectBox),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CodeListSelectBox),
      multi: true
    }
  ]
})
export class CodeListSelectBox<T = any> implements ControlValueAccessor, Validator {
  private dialog = inject(MatDialog);

  items = input.required<T[]>();
  keySelector = input.required<(item: T) => any>();
  displayMemberSelector = input<(item: T) => string>((item: T) => String(item));
  placeholder = input<string>('Izberite...');
  label = input<string>('');
  required = input<boolean>(false);
  insertFormComponent = input<Type<FormBase<unknown>>>();
  insertFormResultMapper = input<(result: FormResult) => Promise<T | undefined>>();
  insertFormInputs = input<any>({});
  insertFormTitle = input<string>('Dodaj nov vnos');
  itemTemplate = input<TemplateRef<any>>();

  addedItems = signal<T[]>([]);
  allItems = computed(() => {
    const seen = new Set<any>();
    return [...this.items(), ...this.addedItems()].filter(item => {
      const key = this.keySelector()(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
  private _value = signal<any>(undefined);
  selectedItem = computed<T | null>(() => {
    let item = this._value() != null ? (this.allItems().find(i => this.keySelector()(i) == this._value()) ?? null) : null
    return item;
  }
  );
  isDisabled = signal(false);

  searchFn = (term: string, item: T): boolean =>
    this.displayMemberSelector()(item).toLowerCase().includes(term.toLowerCase());

  compareWithFn = (a: T, b: T): boolean =>
    a != null && b != null && this.keySelector()(a) === this.keySelector()(b);

  private _onChange: (value: any) => void = () => { };
  private _onTouched: () => void = () => { };

  writeValue(value: any): void {
    this._value.set(value ?? null);
  }

  registerOnChange(fn: any): void { this._onChange = fn; }
  registerOnTouched(fn: any): void { this._onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }

  validate(control: AbstractControl): ValidationErrors | null {
    return this.required() && this.selectedItem() == null ? { required: true } : null;
  }

  onSelectionChange(item: T | null): void {
    this._value.set(item != null ? this.keySelector()(item) : null);
    this._onChange(item != null ? this.keySelector()(item) : null);
    this._onTouched();
  }

  onTouched(): void {
    this._onTouched();
  }

  async openInsertDialog(): Promise<void> {
    const formComponent = this.insertFormComponent();
    if (!formComponent || this.isDisabled()) return;

    const result = await firstValueFrom(
      this.dialog.open(InsertFormDialogWrapper, {
        width: '80vw',
        height: '80vh',
        // width: 'fit-content',
        data: { formComponent, formInputs: this.insertFormInputs(), title: this.insertFormTitle() }
      }).afterClosed()
    );

    if (result?.success) {
      const newItem = await this.insertFormResultMapper()!(result as FormResult);
      if (newItem == null) return;
      this.addedItems.update(items => [...items, newItem]);
      this.onSelectionChange(newItem);
    }
  }
}

// Dialog wrapper component for the insert form
@Component({
  selector: 'cn-insert-form-dialog-wrapper',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  styles: [`
    mat-dialog-content ::ng-deep cn-floating-action-bar { display: none !important; }
  `],
  template: `
    <h4 mat-dialog-title>{{ title() }}</h4>
    <mat-dialog-content>
      <ng-container #formContainer></ng-container>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Prekliči</button>
      <button mat-flat-button color="primary" type="button" (click)="submit()">Shrani</button>
    </mat-dialog-actions>
  `,
})
export class InsertFormDialogWrapper<T> implements AfterViewInit {
  data = inject<{ formComponent: Type<FormBase<T>>, formInputs: any, title: string }>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<InsertFormDialogWrapper<T>>);
  cdr = inject(ChangeDetectorRef);

  @ViewChild('formContainer', { read: ViewContainerRef })
  formContainer!: ViewContainerRef;

  private formInstance: any;
  title = signal('Nov vnos');

  submit(): void {
    if (this.formInstance?.formComponent?.()) {
      this.formInstance.formComponent().onSubmit();
    } else if (this.formInstance?.onSubmit) {
      this.formInstance.onSubmit();
    }
  }

  ngAfterViewInit(): void {
    if (!this.formContainer) {
      console.error('formContainer is null!');
      return;
    }

    const componentRef = this.formContainer.createComponent(this.data.formComponent);
    this.formInstance = componentRef.instance;

    Object.keys(this.data.formInputs).forEach(key => {
      (componentRef.instance as any)[key] = this.data.formInputs[key];
    });

    this.title.set(this.data.title || 'Nov vnos');

    componentRef.instance.formClose.subscribe((result: any) => {
      this.dialogRef.close(result);
    });

    this.cdr.detectChanges();
  }
}
