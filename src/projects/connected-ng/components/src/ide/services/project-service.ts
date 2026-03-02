import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { configurationValue, UrlService } from '@connected-ng/core';

// Project Service Configuration
export const PROJECT_SERVICE_CONFIG = new InjectionToken<ProjectServiceConfiguration>('PROJECT_SERVICE_CONFIG');

export class ProjectServiceConfiguration {
  baseUrl = configurationValue.required<string>('Project service base URL');
}

// DTOs matching Connected.Ide backend
export interface IProjectQueryDto {
  context?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IdeProjectService {
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private configuration = inject(PROJECT_SERVICE_CONFIG);

  private static readonly serviceUrl = 'services/ide/projects';

  query(dto?: IProjectQueryDto): Observable<IdeProject[]> {
    let params = new HttpParams();

    if (dto?.context) {
      params = params.append('context', dto.context);
    }

    return this.http.get<IdeProject[]>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeProjectService.serviceUrl}/query`),
      { params }
    );
  }
}

// Backend IProject interface from Connected.Ide (extends IDocument/IEditorItem)
export interface IdeProject {
  id: string;
  type: string;
  name: string;
  project: string;
}
