import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { configurationValue, queryParamsMapper, UrlService } from '@connected-ng/core';
import { IEditorItemProperty, IEditorItemPropertyQueryDto, IEditorItemPropertyUpdateDto } from './dtos/editor-item-property';

// Property Service Configuration
export const EDITOR_PROPERTY_SERVICE_CONFIG = new InjectionToken<EditorPropertyServiceConfiguration>('EDITOR_PROPERTY_SERVICE_CONFIG');

export class EditorPropertyServiceConfiguration {
  baseUrl = configurationValue.required<string>('Editor property service base URL');
}

/**
 * Service for querying and updating editor item properties
 * Corresponds to IEditorPropertyService in Connected.Ide
 * Base URL: services/ide/properties
 */
@Injectable({
  providedIn: 'root',
})
export class IdeEditorPropertyService {
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private configuration = inject(EDITOR_PROPERTY_SERVICE_CONFIG);

  private static readonly serviceUrl = 'services/ide/properties';

  /**
   * Query properties for an editor item
   * GET operation
   * @param dto Query parameters including the editor item identifier
   * @returns Observable of editor item properties
   */
  query(dto: IEditorItemPropertyQueryDto): Observable<IEditorItemProperty[]> {
    return this.http.get<IEditorItemProperty[]>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeEditorPropertyService.serviceUrl}/query`),
      { params: queryParamsMapper(dto) }
    );
  }

  /**
   * Update a property value for an editor item
   * PUT operation
   * @param dto The property update data (iEditorItem, name, value)
   * @returns Observable of the updated property
   */
  update(dto: IEditorItemPropertyUpdateDto): Observable<IEditorItemProperty> {
    return this.http.put<IEditorItemProperty>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${IdeEditorPropertyService.serviceUrl}/update`),
      dto
    );
  }
}
