import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { map, share, tap } from 'rxjs/operators';
import { configurationValue, UrlService, EventService, EventKey, queryParamsMapper } from '@connected-ng/core';

// Document Service Configuration
export const DOCUMENT_SERVICE_CONFIG = new InjectionToken<DocumentServiceConfiguration>('DOCUMENT_SERVICE_CONFIG');

export class DocumentServiceConfiguration {
  baseUrl = configurationValue.required<string>('Document service base URL');
}

// DTOs matching Connected.Ide backend
export interface IDocumentQueryDto {
  documentType?: string;
}

export interface ISelectDocumentDto {
  id: string;
  context?: string;
}

export interface ICloseDocumentDto {
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class IdeDocumentService {
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private configuration = inject(DOCUMENT_SERVICE_CONFIG);

  private static readonly serviceUrl = 'services/ide/documents';

  // Backend event observables (SignalR events from backend)
  activatedSubject = new ReplaySubject<IdeDocument>();
  deactivatedSubject = new Subject<IdeDocument>();
  $activated?: Observable<IdeDocument> = this.activatedSubject.asObservable();
  $deactivated?: Observable<IdeDocument> = this.deactivatedSubject.asObservable();

  query(dto?: IDocumentQueryDto): Observable<IdeDocument[]> {
    return this.http.get<IdeDocument[]>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeDocumentService.serviceUrl}/query`),
      { params: queryParamsMapper(dto) }
    );
  }

  select(dto: ISelectDocumentDto) {
    return this.http.get<IdeDocument | undefined>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeDocumentService.serviceUrl}/select`),
      { params: queryParamsMapper(dto) }
    );
  }

  close(dto: IdeDocument): void {
    this.deactivatedSubject.next(dto);
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
