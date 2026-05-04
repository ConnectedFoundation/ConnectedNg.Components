import { inject, Injectable, NgZone, signal } from '@angular/core';
import { EventService } from '@connected-ng/core';

@Injectable({ providedIn: 'root' })
export class DirtyEditorItemService {
  private eventService = inject(EventService);
  private ngZone = inject(NgZone);
  private _dirtyItems = signal<Set<string>>(new Set());
  readonly dirtyItems = this._dirtyItems.asReadonly();

  constructor() {
    this.eventService.on<{ id: string; isDirty: boolean }>('services/ide/dirty-editor-items/statechanged')
      .subscribe(({ id, isDirty }) =>
        // SignalR callbacks run outside Angular's zone; run() schedules change detection.
        this.ngZone.run(() =>
          this._dirtyItems.update(s => {
            const next = new Set(s);
            if (isDirty) next.add(id);
            else next.delete(id);
            return next;
          })
        )
      );
  }

  isDirty(id: string): boolean {
    return this._dirtyItems().has(id);
  }

  markDirty(id: string): void {
    this._dirtyItems.update(s => {
      if (s.has(id)) return s;
      const next = new Set(s);
      next.add(id);
      return next;
    });
  }

  clearDirty(id: string): void {
    this._dirtyItems.update(s => {
      if (!s.has(id)) return s;
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }
}
