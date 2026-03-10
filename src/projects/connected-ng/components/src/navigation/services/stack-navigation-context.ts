import { Component, computed, Injectable, InjectionToken, signal, Type } from '@angular/core';

export const STACK_PAGE = new InjectionToken<StackPageInfo<unknown>>('STACK_PAGE');

@Injectable()
export class StackNavigationContext {
  stack = signal<StackPageInfo<unknown>[]>([]);

  activePage = computed(() => {
    let newActive = this.stack().at(-1);
    return newActive;
  });

  constructor() {
  }

  push(page: StackPageInfo<unknown>) {
    this.stack.set([...this.stack(), page]);
  }

  pop() {
    if (this.stack().length > 1) {
      this.stack.update((stack) => {
        return stack.slice(0, -1);
      });
    }
  }
}

export interface StackPageInfo<T> {
  component: Type<unknown>;
  headerComponent?: Type<unknown>;
  data: T;
  title: string;
  key: string;
}

@Component({
  imports: [],
  template: ''
})
class EmptyPagePlaceholder { }

export const EmptyPage: StackPageInfo<undefined> = {
  component: EmptyPagePlaceholder, title: '', data: undefined, key: ''
};
