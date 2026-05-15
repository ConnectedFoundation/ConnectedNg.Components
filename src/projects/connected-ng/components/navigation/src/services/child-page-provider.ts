import { inject, Injectable, InjectionToken, Injector, Type, ValueProvider } from '@angular/core';
import { StackPageInfo } from './stack-navigation-context';

export interface ChildPageRegistration {
  factory: (params: Record<string, string>, injector: Injector) => StackPageInfo<unknown>;
  routePattern: string;
  action?: {
    label: string;
    description?: string;
    icon?: string;
  };
}

interface ChildPageToken {
  parentComponent: Type<unknown>;
  registration: ChildPageRegistration;
}

export const CHILD_PAGE = new InjectionToken<ChildPageToken>('CHILD_PAGE');

export function provideChildPage<T>(
  parentComponent: Type<T>,
  registration: ChildPageRegistration
): ValueProvider {
  return { provide: CHILD_PAGE, useValue: { parentComponent, registration }, multi: true };
}

@Injectable({ providedIn: 'root' })
export class ChildPageProviderService {
  private readonly registry = new Map<Type<unknown>, ChildPageRegistration[]>();

  constructor() {
    const tokens = inject(CHILD_PAGE, { optional: true }) as ChildPageToken[] | null;
    for (const token of tokens ?? []) {
      this.register(token.parentComponent, token.registration);
    }
  }

  register(parentComponent: Type<unknown>, registration: ChildPageRegistration): void {
    const existing = this.registry.get(parentComponent) ?? [];
    this.registry.set(parentComponent, [...existing, registration]);
  }

  getRegistrations(parentComponent: Type<unknown>): ChildPageRegistration[] {
    return this.registry.get(parentComponent) ?? [];
  }

  createChildPages(
    parentComponent: Type<unknown>,
    params: Record<string, string>,
    injector: Injector
  ): StackPageInfo<unknown>[] {
    return this.getRegistrations(parentComponent).map(r => r.factory(params, injector));
  }
}
