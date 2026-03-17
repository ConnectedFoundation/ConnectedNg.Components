import { Component, inject, Injectable, InjectionToken } from '@angular/core';
import { IdeDocument } from './document-service';
import { ComponentType } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';
import { configurationValue, queryParamsMapper, UrlService } from '@connected-ng/core';
import { EXPLORER_ITEM_SERVICE_CONFIG } from './explorer-item-service';
import { map, Observable } from 'rxjs';
import { SelectedItem } from './selection-service';

export type IdeEditorMatchFunction = (document: IEditor) => ComponentType<unknown> | undefined;

export const EDITOR_SERVICE_CONFIG = new InjectionToken<EditorServiceConfiguration>('EDITOR_SERVICE_CONFIG');
export class EditorServiceConfiguration {
  baseUrl = configurationValue.required<string>('Editor service base URL');
}

@Injectable({
  providedIn: 'root',
})
export class IdeEditorService {
  private resolvers: IdeEditorMatchFunction[] = [];

  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private configuration = inject(EXPLORER_ITEM_SERVICE_CONFIG);

  private static readonly serviceUrl = 'services/ide/editors';


  registerEditor(matchFunction: IdeEditorMatchFunction) {
    this.resolvers.push(matchFunction);
  }

  resolveEditor(document: SelectedItem): Observable<ComponentType<unknown> | undefined> {
    return this.query(document).pipe(map((results) => {
      for (let result of results) {
        for (let resolve of this.resolvers) {
          let editor = resolve(result);

          if (editor)
            return editor;
        }
      }
      return undefined;
    }));
  }

  query(dto?: IEditorQueryDto): Observable<IEditor[]> {
    return this.http.get<IEditor[]>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeEditorService.serviceUrl}/query`),
      { params: queryParamsMapper(dto) }
    );
  }
}


export interface IEditorQueryDto {
  id: string;
  project?: string;
  context?: string;
}

export interface IEditor {
  name: string;
  code: string;
}
