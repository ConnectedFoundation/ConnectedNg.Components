import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { configurationValue, UrlService } from '@connected-ng/core';

// Toolbox Item Service Configuration
export const TOOLBOX_ITEM_SERVICE_CONFIG = new InjectionToken<ToolboxItemServiceConfiguration>('TOOLBOX_ITEM_SERVICE_CONFIG');

export class ToolboxItemServiceConfiguration {
  baseUrl = configurationValue.required<string>('Toolbox item service base URL');
}

// DTOs matching Connected.Ide backend
export interface IToolboxItemQueryDto {
  editor?: string;
  document?: string;
  project?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IdeToolboxItemService {
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private configuration = inject(TOOLBOX_ITEM_SERVICE_CONFIG);

  private static readonly serviceUrl = 'services/ide/toolbox-items';

  query(dto?: IToolboxItemQueryDto): Observable<IdeToolboxItem[]> {
    let params = new HttpParams();

    if (dto?.editor) {
      params = params.append('editor', dto.editor);
    }
    if (dto?.document) {
      params = params.append('document', dto.document);
    }
    if (dto?.project) {
      params = params.append('project', dto.project);
    }

    return this.http.get<IdeToolboxItem[]>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeToolboxItemService.serviceUrl}/query`),
      { params }
    );
  }
}

export class IdeToolboxItem {
  name: string;
  description: string;
  key: string;

  constructor(name: string, description: string, key: string) {
    this.name = name;
    this.description = description;
    this.key = key;
  }

  equals(other: IdeToolboxItem): boolean {
    return this.key === other.key;
  }
}
