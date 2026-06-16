import { Component, effect, inject, input, signal, ViewContainerRef, viewChild, output, computed } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DtoDescriptor, InvokableServiceOperation } from '@connected-ng/core';
import { ActionBarComponent, ActionDescriptionWithAction } from '@connected-ng/components';
import { FormBase, FormGenerationInterceptors, generateFormFromDtoDescriptor, DynamicFormMetadata } from '@connected-ng/components/forms';
import { ActionsProviderContract, StackNavigationContext } from '@connected-ng/components/navigation';
import { NotificationService } from '@connected-ng/components/notifications';
import { BusyService, BusyIndicatorStructuralDirective } from '@connected-ng/components/indicators';

@Component({
  selector: 'cn-code-list-insert-form',
  standalone: true,
  imports: [ReactiveFormsModule, BusyIndicatorStructuralDirective],
  templateUrl: './code-list-insert-form.html',
  styleUrl: './code-list-insert-form.scss',
})
export class CodeListInsertForm<TDto extends object> extends FormBase<TDto> implements ActionsProviderContract {
  // Inputs
  serviceOperation = input.required<InvokableServiceOperation<TDto, any>>();
  title = input<string>('New Item');
  actions = input<ActionDescriptionWithAction[]>([]);
  formInterceptors = input<FormGenerationInterceptors>();
  
  // Services
  navigationContext = inject(StackNavigationContext);
  private notificationService = inject(NotificationService);
  private busyService = inject(BusyService);

  // State
  dtoDescriptor = signal<DtoDescriptor | undefined>(undefined);
  formMetadata = signal<DynamicFormMetadata | undefined>(undefined);
  field(name: string) {
    return computed(() => this.formMetadata()?.fields.find(e => e.fieldName == name));
  }
  isLoading = signal<boolean>(true);
  saving = signal<boolean>(false);
  override form: FormGroup = new FormGroup({});
  pageActions = computed(() => this.actions().length ? this.actions() : this.defaultActions());

  // View children for dynamic component creation
  formFieldsContainer = viewChild<any, ViewContainerRef>('formFieldsContainer', { read: ViewContainerRef });

  // Actions
  defaultActions = signal<ActionDescriptionWithAction[]>([]);

  constructor() {
    super();

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
          description: $localize`:@@code-list.action.save.description:Save new entry`,
          icon: 'check_circle',
          disabled: isSaving,
          action: () => this.onSubmit()
        }
      ]);
    });

    effect(() => {
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
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.serviceOperation().describeDto().subscribe({
      next: (descriptor) => {
        this.dtoDescriptor.set(descriptor);
        this.generateForm({}, descriptor);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading descriptor:', err);
        this.isLoading.set(false);
      }
    });
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
      this.serviceOperation()(model).subscribe({
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