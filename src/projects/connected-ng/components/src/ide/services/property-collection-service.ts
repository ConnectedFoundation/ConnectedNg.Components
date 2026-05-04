import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { configurationValue, queryParamsMapper, UrlService } from '@connected-ng/core';
import { IPropertyValueCollectionItem, IPropertyValueCollectionQueryDto } from './dtos/property-collection-item';

export const PROPERTY_COLLECTION_SERVICE_CONFIG = new InjectionToken<PropertyCollectionServiceConfiguration>(
  'PROPERTY_COLLECTION_SERVICE_CONFIG'
);

export class PropertyCollectionServiceConfiguration {
  baseUrl = configurationValue.required<string>('Property collection service base URL');
}

/**
 * Service for querying property value collection items.
 * Corresponds to IPropertyValueCollectionService in Connected.Ide.
 * Base URL: services/ide/properties/collections
 */
@Injectable({ providedIn: 'root' })
export class PropertyCollectionService {
  private readonly http = inject(HttpClient);
  private readonly urlService = inject(UrlService);
  private readonly configuration = inject(PROPERTY_COLLECTION_SERVICE_CONFIG);

  private static readonly serviceUrl = 'services/ide/properties/collections';

  query(dto: IPropertyValueCollectionQueryDto): Observable<IPropertyValueCollectionItem[]> {
    return this.http.get<IPropertyValueCollectionItem[]>(
      this.urlService.generateUrl(
        this.configuration.baseUrl(),
        `${PropertyCollectionService.serviceUrl}/query`
      ),
      { params: queryParamsMapper(dto) }
    );
  }
}
