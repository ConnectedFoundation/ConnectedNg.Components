import { NgComponentOutlet } from '@angular/common';
import { Component, ComponentRef, computed, effect, inject, Injector, input, OnDestroy, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { STACK_PAGE, StackNavigationContext, StackPageInfo } from '../services/stack-navigation-context';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';

@Component({
  selector: 'cn-stack-page',
  imports: [NgComponentOutlet, MatButtonModule],
  templateUrl: './stack-page.html',
  styleUrl: './stack-page.scss',
  providers: [
    { provide: STACK_PAGE, useExisting: (self: StackPage) => self.pageInfo() }
  ]
})
export class StackPage implements OnDestroy {
  component = input.required<Type<unknown>>();

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
  }

  private cleanup() {
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
