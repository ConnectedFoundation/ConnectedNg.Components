import { Component, Injectable } from '@angular/core';
import { IdeDocument } from './document-service';
import { ComponentType } from '@angular/cdk/overlay';

export type IdeEditorMatchFunction = (document: IdeDocument) => ComponentType<unknown> | undefined;

@Injectable({
  providedIn: 'root',
})
export class IdeEditorService {
  private resolvers: IdeEditorMatchFunction[] = [];

  registerEditor(matchFunction: IdeEditorMatchFunction) {
    this.resolvers.push(matchFunction);
  }

  resolveEditor(document: IdeDocument): ComponentType<unknown> | undefined {
    for (let resolve of this.resolvers) {
      let editor = resolve(document);

      if (editor)
        return editor;
    }

    return undefined;
  }
}
