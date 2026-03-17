import { Injectable, InjectionToken } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { configurationValue } from '@connected-ng/core';
import { EditorItem } from './dtos/editor-item';

// Selection Service Configuration
export const SELECTION_SERVICE_CONFIG = new InjectionToken<SelectionServiceConfiguration>('SELECTION_SERVICE_CONFIG');

export class SelectionServiceConfiguration {
  baseUrl = configurationValue.required<string>('Selection service base URL');
}

// DTOs matching Connected.Ide backend
export interface SelectedItem extends EditorItem {
  currentEditor?: string;
  context?: string;
}

export interface DeselectDto {
  currentEditor?: string;
  id: string;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  selectedSubject = new Subject<SelectedItem>();
  deselectedSubject = new Subject<DeselectDto>();
  $selected?: Observable<SelectedItem> = this.selectedSubject.asObservable();
  $deselected?: Observable<DeselectDto> = this.deselectedSubject.asObservable();

  select(dto: SelectedItem): void {
    console.log('[SelectionService] Broadcasting selection:', dto.id, 'from', dto.currentEditor);
    this.selectedSubject.next(dto);
  }

  deselect(dto: DeselectDto): void {
    this.deselectedSubject.next(dto);
  }
}
