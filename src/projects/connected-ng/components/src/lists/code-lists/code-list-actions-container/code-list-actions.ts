import { ActionDescription, ActionDescriptionWithAction } from "../../../action-tile/action-tile";

export type ItemAction = (item: unknown) => void;

export interface CodeListAction extends ActionDescription {
  itemAction: (item: unknown) => void;
  icon?: string | undefined;
  label: string;
  description?: string | undefined;
}

export const convertToAction = (action: CodeListAction, item: unknown) => {
  return { icon: action.icon, label: action.label, description: action.description, action: () => action.itemAction(item) } as ActionDescriptionWithAction;
}

export const createCodeListAction = (actionDescription: ActionDescription, itemAction: ItemAction) => {
  return Object.assign(actionDescription, { itemAction }) as CodeListAction;
}


export class CodeListActions {
  static editAction(action: ItemAction): CodeListAction {
    return createCodeListAction({ label: 'Edit', description: 'Edit this code-list item', icon: 'edit' }, action);
  };

  static relatedCodeListAction(action: ItemAction): CodeListAction {
    return createCodeListAction({ label: 'Edit connected', description: 'Edit connected code-list', icon: 'edit' }, action);
  };
}
