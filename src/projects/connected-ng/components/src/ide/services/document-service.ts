import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SelectionService } from './selection-service';

@Injectable({
  providedIn: 'root',
})
export class IdeDocumentService {
  private selectionService = inject(SelectionService);

  // Use Subject for events
  private documentClosedSubject = new Subject<IdeDocument>();
  private documentSelectedSubject = new Subject<IdeDocument>();
  private _selectedDocument?: IdeDocument;

  // Expose as observables (read-only)
  documentClosed$ = this.documentClosedSubject.asObservable();
  documentSelected$ = this.documentSelectedSubject.asObservable();

  get selectedDocument(): IdeDocument | undefined {
    return this._selectedDocument;
  }

  selectDocument(document: IdeDocument) {
    this._selectedDocument = document;
    this.selectionService.selectItem(document, this);
    this.documentSelectedSubject.next(document);
  }

  closeDocument(document: IdeDocument) {
    this.documentClosedSubject.next(document);
  }
}

export class IdeDocument {
  id: string;
  type: string;
  data: any;
  project: string;
  title: string;
  editor: string;

  constructor(id: string, type: string, project: string, title: string, editor: string, data?: any) {
    this.id = id;
    this.type = type;
    this.project = project;
    this.data = data;
    this.title = title;
    this.editor = editor;
  }

  equals(other: IdeDocument): boolean {
    return this.id == other.id && this.type == other.type && this.project == other.project && this.editor == this.editor;;
  }
}

export class IdeDocumentNode extends IdeDocument {
  parent?: string;

  constructor(id: string, type: string, project: string, title: string, parent?: string, data?: any) {
    super(id, type, project, title, data);

    this.parent = parent;
  }
}
