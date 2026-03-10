import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, Injector, input, Type } from '@angular/core';
import { STACK_PAGE, StackNavigationContext, StackPageInfo } from '../services/stack-navigation-context';
import { MatButton, MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'cn-stack-page',
  imports: [NgComponentOutlet, MatButtonModule],
  templateUrl: './stack-page.html',
  styleUrl: './stack-page.scss',
  providers: [
    { provide: STACK_PAGE, useExisting: (self: StackPage) => self.pageInfo() }
  ]
})
export class StackPage {
  component = input.required<Type<unknown>>();

  title = input.required<string>();

  injector = inject(Injector);

  isRoot = input<boolean>(true);

  data = input<any>();

  pageInfo = input.required<StackPageInfo<unknown>>();

  dataInputs = computed<Record<string, unknown>>(() => {
    return this.toRecord(this.data());
  });

  navigationContext = inject(StackNavigationContext);

  toRecord(value: unknown): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }
}
