import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, share, tap } from 'rxjs/operators';
import { configurationValue, UrlService, EventService, EventKey } from '@connected-ng/core';

// Document Service Configuration
export const DOCUMENT_SERVICE_CONFIG = new InjectionToken<DocumentServiceConfiguration>('DOCUMENT_SERVICE_CONFIG');

export class DocumentServiceConfiguration {
  baseUrl = configurationValue.required<string>('Document service base URL');
}

// DTOs matching Connected.Ide backend
export interface IDocumentQueryDto {
  project?: string;
  documentType?: string;
}

export interface IActivateDocumentDto {
  project: string;
  document: string;
}

export interface ICloseDocumentDto {
  session: string;
  project: string;
  document: string;
}

@Injectable({
  providedIn: 'root',
})
export class IdeDocumentService {
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private configuration = inject(DOCUMENT_SERVICE_CONFIG);
  private events = inject(EventService);

  private static readonly serviceUrl = 'services/ide/documents';

  // Backend event observables (SignalR events from backend)
  $activated?: Observable<IdeDocument>;
  $deactivated?: Observable<IdeDocument>;

  private _activeDocument?: IdeDocument;

  constructor() {
    // Hook up backend events
    this.$activated = this.events.on<any>(`${IdeDocumentService.serviceUrl}/activated` as EventKey).pipe(map(e => { return { id: e.document, project: e.project, name: e.name, type: e.type, session: e.session } as IdeDocument }), share());
    this.$deactivated = this.events.on<any>(`${IdeDocumentService.serviceUrl}/deactivated` as EventKey).pipe(map(e => { return { id: e.document, project: e.project, name: e.name, type: e.type, session: e.session } as IdeDocument }), share());
  }

  get activeDocument(): IdeDocument | undefined {
    return this._activeDocument;
  }

  query(dto?: IDocumentQueryDto): Observable<IdeDocument[]> {
    let params = new HttpParams();

    if (dto?.project) {
      params = params.append('project', dto.project);
    }
    if (dto?.documentType) {
      params = params.append('documentType', dto.documentType);
    }

    return this.http.get<IdeDocument[]>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeDocumentService.serviceUrl}/query`),
      { params }
    );
  }

  activate(dto: IActivateDocumentDto): Observable<void> {
    return this.http.post<void>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeDocumentService.serviceUrl}/activate`),
      dto
    );
  }

  close(dto: ICloseDocumentDto): Observable<void> {
    return this.http.post<void>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeDocumentService.serviceUrl}/close`),
      dto
    );
  }

  selectActive(): Observable<IdeDocument | null> {
    return this.http.get<IdeDocument | null>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeDocumentService.serviceUrl}/active`)
    ).pipe(
      tap(document => {
        if (document) {
          this._activeDocument = document;
        }
      })
    );
  }
}

// Backend IDocument interface from Connected.Ide (IEditorItem)
export interface IdeDocument {
  id: string;
  type: string;
  name: string;
  project: string;
}

export function documentsEqual(doc1: IdeDocument, doc2: IdeDocument): boolean {
  return (
    doc1.id === doc2.id &&
    doc1.type === doc2.type &&
    doc1.project === doc2.project
  );
}
