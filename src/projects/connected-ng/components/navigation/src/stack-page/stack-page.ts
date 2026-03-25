import { NgComponentOutlet } from '@angular/common';
import { Component, ComponentRef, computed, effect, EffectRef, inject, Injector, input, OnDestroy, signal, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { STACK_PAGE, StackNavigationContext, StackPageInfo } from '../services/stack-navigation-context';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { ActionBarComponent, ActionDescriptionWithAction } from "@connected-ng/components";
import { isActionsProvider } from './actions-provider-contract';

@Component({
  selector: 'cn-stack-page',
  imports: [NgComponentOutlet, MatButtonModule, ActionBarComponent],
  templateUrl: './stack-page.html',
  styleUrl: './stack-page.scss',
  providers: [
    { provide: STACK_PAGE, useExisting: (self: StackPage) => self.pageInfo() }
  ]
})
export class StackPage implements OnDestroy {
  component = input.required<Type<unknown>>();

  isActivePage = computed(() => this.navigationContext.activePage() == this.pageInfo());

  private defaultActions = computed(() => this.isRoot?.() ? [] : [{
    label: 'Back',
    action: () => this.navigationContext.pop(),
    description: 'Return to the previous screen',
    icon: 'arrow_back'
  }]);

  actions = signal<ActionDescriptionWithAction[]>([]);

  injector = inject(Injector);

  isRoot = input<boolean>(true);

  data = input<any>();

  pageInfo = input.required<StackPageInfo<unknown>>();

  dataInputs = computed<Record<string, unknown>>(() => {
    return this.toRecord(this.data());
  });

  navigationContext = inject(StackNavigationContext);

  @ViewChild('componentContainer', { read: ViewContainerRef })
  componentContainer!: ViewContainerRef;

  private componentRef: ComponentRef<any> | null = null;
  private outputSubscriptions: Subscription[] = [];
  private actionsEffectRef: EffectRef | null = null;

  constructor() {
    // Effect to create component when inputs change
    effect(() => {
      const component = this.component();
      const data = this.data();
      const outputs = this.pageInfo().outputs as any; // Allow symbols temporarily

      if (this.componentContainer) {
        this.createComponent(component, data, outputs);
      }
    });
  }

  ngAfterViewInit() {
    // Create component after view is initialized
    this.createComponent(this.component(), this.data(), this.pageInfo().outputs as any);
  }

  private createComponent(component: Type<unknown>, data: any, outputs?: Record<string, ((...args: any[]) => void) | symbol>) {
    // Clean up previous component and subscriptions
    this.cleanup();

    if (!this.componentContainer) return;

    // Create the component
    this.componentRef = this.componentContainer.createComponent(component, {
      injector: this.injector
    });

    // Set inputs
    const inputs = this.toRecord(data);
    Object.entries(inputs).forEach(([key, value]) => {
      this.componentRef!.setInput(key, value);
    });

    // Subscribe to outputs
    if (outputs && this.componentRef.instance) {
      Object.entries(outputs).forEach(([outputName, handler]) => {
        // Skip symbols (they should have been converted to functions already)
        if (typeof handler !== 'function') {
          console.warn(`[StackPage] Output handler for '${outputName}' is not a function, skipping:`, handler);
          return;
        }

        const outputEmitter = (this.componentRef!.instance as any)[outputName];
        if (outputEmitter && typeof outputEmitter.subscribe === 'function') {
          const subscription = outputEmitter.subscribe(handler);
          this.outputSubscriptions.push(subscription);
        }
      });
    }

    // Trigger change detection
    this.componentRef.changeDetectorRef.detectChanges();

    // Bind component actions if it implements ActionsProviderContract
    if (isActionsProvider(this.componentRef.instance)) {
      const provider = this.componentRef.instance;
      this.actionsEffectRef = effect(
        () => this.actions.set(provider.pageActions()),
        { injector: this.injector }
      );
    }
  }

  private cleanup() {
    // Destroy actions effect before component
    if (this.actionsEffectRef) {
      this.actionsEffectRef.destroy();
      this.actionsEffectRef = null;
      this.actions.set(this.defaultActions());
    }

    // Unsubscribe from all outputs
    this.outputSubscriptions.forEach(sub => sub.unsubscribe());
    this.outputSubscriptions = [];

    // Destroy previous component
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }

    // Clear container
    if (this.componentContainer) {
      this.componentContainer.clear();
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  getRenderedComponent<T>() {
    return this.componentRef?.instance as T;
  }

  toRecord(value: unknown): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }
}
