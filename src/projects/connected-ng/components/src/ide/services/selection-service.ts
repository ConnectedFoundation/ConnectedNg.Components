import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { configurationValue, UrlService, EventService, EventKey } from '@connected-ng/core';

// Selection Service Configuration
export const SELECTION_SERVICE_CONFIG = new InjectionToken<SelectionServiceConfiguration>('SELECTION_SERVICE_CONFIG');

export class SelectionServiceConfiguration {
  baseUrl = configurationValue.required<string>('Selection service base URL');
}

// DTOs matching Connected.Ide backend
export interface ISelectDto {
  session: string;
  project: string;
  item: string;
  currentEditor?: string;
  type: string;
}

export interface IDeselectDto {
  session: string;
  project: string;
  item: string;
  currentEditor?: string;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  private http = inject(HttpClient);
  private urlService = inject(UrlService);
  private configuration = inject(SELECTION_SERVICE_CONFIG);
  private events = inject(EventService);

  private static readonly serviceUrl = 'services/ide/selection';

  // Backend event observables (SignalR events from backend)
  $selected?: Observable<ISelectDto>;
  $deselected?: Observable<IDeselectDto>;

  constructor() {
    // Hook up backend events
    this.$selected = this.events.on<ISelectDto>(`${SelectionService.serviceUrl}/selected` as EventKey);
    this.$deselected = this.events.on<IDeselectDto>(`${SelectionService.serviceUrl}/deselected` as EventKey);
  }

  select(dto: ISelectDto): Observable<void> {
    return this.http.post<void>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${SelectionService.serviceUrl}/select`),
      dto
    );
  }

  deselect(dto: IDeselectDto): Observable<void> {
    return this.http.post<void>(
      this.urlService.generateUrl(this.configuration.baseUrl(), `${SelectionService.serviceUrl}/deselect`),
      dto
    );
  }
}
