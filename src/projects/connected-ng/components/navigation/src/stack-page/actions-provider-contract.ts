import { Signal } from '@angular/core';
import { ActionDescriptionWithAction } from '@connected-ng/components';

export interface ActionsProviderContract {
  pageActions: Signal<ActionDescriptionWithAction[]>;
}

export function isActionsProvider(instance: unknown): instance is ActionsProviderContract {
  return (
    typeof instance === 'object' &&
    instance !== null &&
    'pageActions' in instance &&
    typeof (instance as any).pageActions === 'function'
  );
}
