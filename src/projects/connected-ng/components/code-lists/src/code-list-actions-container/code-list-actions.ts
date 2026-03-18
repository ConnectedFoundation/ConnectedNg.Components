import { ActionDescription, ActionDescriptionWithAction, ItemAction, UrlParameter } from '@connected-ng/components';
import { Status } from '@connected-ng/core';

export interface CodeListAction {
  itemAction?: (item: any) => void;
  icon?: string;
  label: string;
  description?: string;
  url?: UrlParameter;
}

export const convertToAction = (action: CodeListAction, item: unknown) => {
  const url = typeof action.url === 'function' ? action.url(item) : action.url;
  const actionFn = action.itemAction ? () => action.itemAction!(item) : undefined;
  return {
    icon: action.icon,
    label: action.label,
    description: action.description,
    url: url,
    action: actionFn
  } as ActionDescriptionWithAction;
}

export const createCodeListAction = (actionDescription: ActionDescription, itemAction: ItemAction, url?: UrlParameter) => {
  return Object.assign(actionDescription, { itemAction, url }) as CodeListAction;
}

interface ItemWithStatus {
  status: Status;
}

export class CodeListActions {
  static editAction(action: ItemAction, url?: UrlParameter): CodeListAction {
    return createCodeListAction({ label: 'Edit', description: 'Edit this code-list item', icon: 'edit' }, action, url);
  };

  static recordStatusAction(action: ItemAction): CodeListAction {
    return createCodeListAction({ label: 'Edit', description: 'Edit this code-list item', icon: 'edit' }, action);
  };

  static getStatusChangeAction(item: ItemWithStatus, action: ((item:unknown) => void)): CodeListAction  {  
    if (item.status === Status.Enabled) {
      return { label: 'Disable', itemAction: (item: ItemWithStatus) => action({ ...item, status: Status.Disabled }) };
    }
    else {
      return { label: 'Enable', itemAction: (item: ItemWithStatus) => action({ ...item, status: Status.Enabled }) };
    }
  }

  static relatedCodeListAction(action: ItemAction, url?: UrlParameter): CodeListAction {
    return createCodeListAction({ label: 'Edit connected', description: 'Edit connected code-list', icon: 'edit' }, action, url);
  };

  static insertItemAction(action: () => void, url?: UrlParameter): ActionDescriptionWithAction {
    return { label: 'New', description: 'Add new entry', icon: 'add', action, url };
  };
}
