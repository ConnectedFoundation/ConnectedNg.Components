import { Component, effect, inject, input, signal, ViewContainerRef, viewChild, output, computed } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DtoDescriptor, InvokableServiceOperation } from '@connected-ng/core';
import { ActionBarComponent, ActionDescriptionWithAction } from '@connected-ng/components';
import { FormBase, FormGenerationInterceptors, generateFormFromDtoDescriptor, DynamicFormMetadata } from '@connected-ng/components/forms';
import { StackNavigationContext } from '@connected-ng/components/navigation';

@Component({
  selector: 'cn-code-list-insert-form',
  standalone: true,
  imports: [ActionBarComponent, ReactiveFormsModule],
  templateUrl: './code-list-insert-form.html',
  styleUrl: './code-list-insert-form.scss',
})
export class CodeListInsertForm<TDto extends object> extends FormBase<TDto> {
  // Inputs
  serviceOperation = input.required<InvokableServiceOperation<TDto, any>>();
  title = input<string>('New Item');
  actions = input<ActionDescriptionWithAction[]>([]);
  formInterceptors = input<FormGenerationInterceptors>();
  // Services
  navigationContext = inject(StackNavigationContext);

  // State
  dtoDescriptor = signal<DtoDescriptor | undefined>(undefined);
  formMetadata = signal<DynamicFormMetadata | undefined>(undefined);
  isLoading = signal<boolean>(true);
  override form: FormGroup = new FormGroup({});
  displayedActions = computed(() => this.actions().length ? this.actions() : this.defaultActions());

  // View children for dynamic component creation
  formFieldsContainer = viewChild<any, ViewContainerRef>('formFieldsContainer', { read: ViewContainerRef });

  // Actions
  defaultActions = signal<ActionDescriptionWithAction[]>([]);

  constructor() {
    super();

    // Effect to update actions when inputs change
    effect(() => {
      this.defaultActions.set([
        {
          label: 'Back',
          description: 'Return to previous screen',
          icon: 'arrow_back',
          action: () => this.onClose()
        },
        {
          label: 'Save',
          description: 'Save the new item',
          icon: 'save',
          action: () => this.onSubmit()
        }
      ]);
    });

    // Effect to render form fields when metadata changes
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

    // Fetch descriptor and generate empty form for insert
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
    return this.form.value as TDto;
  }

  override onSubmit(): void {
    if (this.form.valid) {
      const model = this.getModel();
      this.serviceOperation()(model).subscribe({
        next: (result) => {
          this.onClose({ result, success: true });
        },
        error: (err) => {
          this.onError(err);
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
