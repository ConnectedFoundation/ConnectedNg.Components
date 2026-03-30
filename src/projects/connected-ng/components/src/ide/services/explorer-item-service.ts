import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { configurationValue, UrlService } from '@connected-ng/core';

// Explorer Item Service Configuration
export const EXPLORER_ITEM_SERVICE_CONFIG = new InjectionToken<ExplorerItemServiceConfiguration>('EXPLORER_ITEM_SERVICE_CONFIG');

export class ExplorerItemServiceConfiguration {
  baseUrl = configurationValue.required<string>('Explorer item service base URL');
}

// DTOs matching Connected.Ide.Model backend
export interface IExplorerItemQueryDto {
  context?: string;
  project?: string;
  type?: string;
  parent?: string;
}

export interface IExplorerItemUpdateParentDto {
  id: string;
  parent: string | null;
}

// Interface matching Connected.Ide.Model.ExplorerItems.IExplorerItem
// Extends IEditorItem (id, type, name, project) and adds parent
export interface IExplorerItem {
  id: string;
  type: string;
  name: string;
  project: string;
  parent: string | null;
  canRename: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class IdeExplorerItemService {
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private configuration = inject(EXPLORER_ITEM_SERVICE_CONFIG);

  private static readonly serviceUrl = 'services/ide/explorer-items';

  query(dto?: IExplorerItemQueryDto): Observable<IExplorerItem[]> {
    let params = new HttpParams();

    if (dto?.context) {
      params = params.append('context', dto.context);
    }
    if (dto?.project) {
      params = params.append('project', dto.project);
    }
    if (dto?.type) {
      params = params.append('type', dto.type);
    }
    if (dto?.parent) {
      params = params.append('parent', dto.parent);
    }

    return this.http.get<IExplorerItem[]>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeExplorerItemService.serviceUrl}/query`),
      { params }
    );
  }

  updateParent(dto: IExplorerItemUpdateParentDto): Observable<void> {
    // No-op for now - will be implemented in backend later
    return of(void 0);
  }
}
