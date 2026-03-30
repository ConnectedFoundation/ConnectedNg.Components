import { inject, Injectable, InjectionToken } from '@angular/core';
import { configurationValue, ConnectedServiceBase } from '@connected-ng/core';

export const EDITOR_ITEM_SERVICE_CONFIG = new InjectionToken<EditorItemServiceConfiguration>('EDITOR_ITEM_SERVICE_CONFIG');

export class EditorItemServiceConfiguration {
  baseUrl = configurationValue.required<string>('Editor item service base URL');
}

export interface IRenameEditorItemDto {
  id: string;
  newName: string;
}

@Injectable({
  providedIn: 'root',
})
export class IdeEditorItemService extends ConnectedServiceBase {
  private configuration = inject(EDITOR_ITEM_SERVICE_CONFIG);

  override serviceUrl = 'services/ide/editor-items';

  override getBaseUrl(): string {
    return this.configuration.baseUrl();
  }

  readonly rename = this.createPostOperation<IRenameEditorItemDto, void>('rename');
}
