import { Component, effect, inject, input, signal, ViewContainerRef, viewChild, output, computed } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DtoDescriptor, InvokableServiceOperation } from '@connected-ng/core';
import { ActionDescriptionWithAction } from '@connected-ng/components';
import { FormBase, FormGenerationInterceptors, generateFormFromDtoDescriptor, DynamicFormMetadata } from '@connected-ng/components/forms';
import { Observable } from 'rxjs';
import { ActionsProviderContract, StackNavigationContext } from '@connected-ng/components/navigation';
import { NotificationService } from '@connected-ng/components/notifications';
import { BusyService, BusyIndicatorStructuralDirective } from '@connected-ng/components/indicators';

@Component({
  selector: 'cn-code-list-update-form',
  imports: [ReactiveFormsModule, BusyIndicatorStructuralDirective],
  templateUrl: './code-list-update-form.html',
  styleUrl: './code-list-update-form.scss'
})
export class CodeListUpdateForm<TDto extends object> extends FormBase<TDto> implements ActionsProviderContract {
  // Inputs
  updateOperation = input.required<InvokableServiceOperation<TDto, any>>();
  formRenderer = input<(instance: CodeListUpdateForm<TDto>) => void>();

  //DTO
  entityLoader = input.required<Observable<any>>();

  actions = input<ActionDescriptionWithAction[]>([]);
  formInterceptors = input<FormGenerationInterceptors>();

  // Services
  navigationContext = inject(StackNavigationContext);
  private notificationService = inject(NotificationService);
  private busyService = inject(BusyService);

  // State
  dtoDescriptor = signal<DtoDescriptor | undefined>(undefined);
  formMetadata = signal<DynamicFormMetadata | undefined>(undefined);
  saving = signal<boolean>(false);
  isLoading = computed(() => this.formMetadata() === undefined);

  field(name: string) {
    return computed(() => this.formMetadata()?.fields.find(e => e.fieldName == name));
  }

  override form: FormGroup = new FormGroup({});

  pageActions = computed(() => this.actions().length ? this.actions() : this.defaultActions());

  // View children for dynamic component creation
  private formFieldsContainer = viewChild<any, ViewContainerRef>('formFieldsContainer', { read: ViewContainerRef });

  // Actions
  defaultActions = signal<ActionDescriptionWithAction[]>([]);

  constructor() {
    super();

    // Effect to update actions when inputs change
    effect(() => {
      const isSaving = this.saving();
      this.defaultActions.set([
        {
          label: $localize`:@@code-list.action.back:Back`,
          description: $localize`:@@code-list.action.back.description:Return to the previous screen`,
          icon: 'arrow_back',
          action: () => this.onClose()
        },
        {
          label: isSaving
            ? $localize`:@@code-list.action.saving:Saving...`
            : $localize`:@@code-list.action.save:Save`,
          description: $localize`:@@cn.code-list-update-form.save.description:Save changes`,
          icon: 'check_circle',
          disabled: isSaving,
          action: () => this.onSubmit()
        }
      ]);
    });

    // Effect to render form fields when metadata changes
    effect(() => {
      this.renderForm();
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.entityLoader().subscribe(entity => {
      // Fetch descriptor and generate empty form for insert
      this.updateOperation().describeDto().subscribe({
        next: (descriptor) => {
          this.dtoDescriptor.set(descriptor);
          this.generateForm(entity, descriptor);
        },
        error: (err) => {
          console.error('Error loading descriptor:', err);
        }
      });
    });

  }

  protected renderForm() {
    if (this.formRenderer()) {
      this.formRenderer()!(this);
      return;
    }

    const metadata = this.formMetadata();
    const container = this.formFieldsContainer();

    if (metadata && container) {
      container.clear();
      metadata.fields.forEach(field => {
        const componentRef = container.createComponent(field.component);
        Object.entries(field.inputs).forEach(([key, value]) => {
          componentRef.setInput(key, value);
        });
      });
    }
  }

  private generateForm(dto: any, descriptor: DtoDescriptor): void {
    const metadata = generateFormFromDtoDescriptor(dto, descriptor, this.formInterceptors());
    this.form = metadata.formGroup;
    this.formMetadata.set(metadata);
  }

  override getModel(): TDto {
    return this.form.getRawValue() as TDto;
  }

  override onError(error: any): void {
    super.onError(error);
    this.formError.emit(error);
  }

  override onSubmit(): void {
    if (this.form.valid) {
      this.saving.set(true);
      const model = this.getModel();
      this.updateOperation()(model).subscribe({
        next: (result) => {
          this.saving.set(false);
          this.onClose({ result, success: true });
        },
        error: (err) => {
          this.saving.set(false);
          this.onError(err);
        }
      });
    } else {
      this.form.markAllAsTouched();
      
      const errorMessage = $localize`:@@cn.form.errors:Please correct the errors above before submitting.`;
      this.notificationService.error(errorMessage);
    }
  }
}
