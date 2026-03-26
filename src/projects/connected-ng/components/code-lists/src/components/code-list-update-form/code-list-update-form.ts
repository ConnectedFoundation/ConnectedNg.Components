import { Component, effect, inject, input, signal, ViewContainerRef, viewChild, output, computed } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DtoDescriptor, InvokableServiceOperation } from '@connected-ng/core';
import { ActionBarComponent, ActionDescriptionWithAction } from '@connected-ng/components';
import { FormBase, FormGenerationInterceptors, generateFormFromDtoDescriptor, DynamicFormMetadata } from '@connected-ng/components/forms';
import { Observable } from 'rxjs';
import { ActionsProviderContract, StackNavigationContext } from '@connected-ng/components/navigation';

@Component({
  selector: 'cn-code-list-update-form',
  imports: [ActionBarComponent, ReactiveFormsModule],
  templateUrl: './code-list-update-form.html',
  styleUrl: './code-list-update-form.scss'
})
export class CodeListUpdateForm<TDto extends object> extends FormBase<TDto> implements ActionsProviderContract {
  // Inputs
  updateOperation = input.required<InvokableServiceOperation<TDto, any>>();

  //DTO
  entityLoader = input.required<Observable<any>>();

  actions = input<ActionDescriptionWithAction[]>([]);
  formInterceptors = input<FormGenerationInterceptors>();

  // Services
  navigationContext = inject(StackNavigationContext);

  // State
  dtoDescriptor = signal<DtoDescriptor | undefined>(undefined);
  formMetadata = signal<DynamicFormMetadata | undefined>(undefined);

  override form: FormGroup = new FormGroup({});

  pageActions = computed(() => this.actions().length ? this.actions() : this.defaultActions());

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
          description: 'Save the item',
          icon: 'check_circle',
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
      this.updateOperation()(model).subscribe({
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
