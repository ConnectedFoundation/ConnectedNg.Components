import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable, defer, MonoTypeOperatorFunction } from 'rxjs';
import { distinctUntilChanged, finalize, map, shareReplay } from 'rxjs/operators';

export type BusyChangeType =
  | 'becameBusy'
  | 'becameIdle'
  | 'incremented'
  | 'decremented'
  | 'cleared';

export interface BusyChange {
  key: string;
  type: BusyChangeType;
  previousCount: number;
  currentCount: number;
  busy: boolean;
}

@Injectable({ providedIn: 'root' })
export class BusyService {
  // Internal mutable store
  private readonly counts = new Map<string, number>();

  // Public snapshot stream (immutable snapshots)
  private readonly _state$ = new BehaviorSubject<ReadonlyMap<string, number>>(new Map());

  /**
   * Subscribe to get the full busy map (count per key).
   * Note: emitted value is a snapshot (ReadonlyMap) - don't mutate it.
   */
  readonly state$ = this._state$.asObservable().pipe(shareReplay({ bufferSize: 1, refCount: true }));

  /**
   * Subscribe to get fine-grained events when a key increments/decrements,
   * becomes busy/idle, or is cleared.
   */
  readonly changes$ = new Subject<BusyChange>();

  track<T>(...keys: string[]): MonoTypeOperatorFunction<T> {
    return (source$) =>
      defer(() => {
        keys.forEach(key => this.setBusy(key, true));
        return source$.pipe(finalize(() => keys.forEach(key => this.setBusy(key, false))));
      });
  }

  setBusy(key: string, busy: boolean): void {
    if (!key) return;

    const prev = this.counts.get(key) ?? 0;

    let next = prev;

    if (busy) {
      next = prev + 1;

      this.counts.set(key, next);

      this.emitChange(key, prev, next, prev === 0 ? 'becameBusy' : 'incremented');
    }
    else {
      if (prev === 0) {
        // Nothing to decrement
        return;
      }

      next = prev - 1;

      if (next <= 0) {
        this.counts.delete(key);

        next = 0;

        this.emitChange(key, prev, next, 'becameIdle');
      } else {
        this.counts.set(key, next);

        this.emitChange(key, prev, next, 'decremented');
      }
    }

    this.publishSnapshot();
  }

  clear(key: string): void {
    if (!key) return;

    const prev = this.counts.get(key) ?? 0;

    if (prev === 0)
      return;

    this.counts.delete(key);

    this.emitChange(key, prev, 0, 'cleared');

    this.publishSnapshot();
  }

  /** Observable<boolean> for a specific key */
  busy$(key: string): Observable<boolean> {
    return this.state$.pipe(
      map(m => ((m.get(key) ?? 0) > 0)),
      distinctUntilChanged()
    );
  }

  /** Observable<number> (ref count) for a specific key */
  count$(key: string): Observable<number> {
    return this.state$.pipe(
      map(m => (m.get(key) ?? 0)),
      distinctUntilChanged()
    );
  }

  /** Observable<boolean> true if ANY key is busy */
  anyBusy$(): Observable<boolean> {
    return this.state$.pipe(
      map(m => {
        for (const v of m.values()) if (v > 0) return true;
        return false;
      }),
      distinctUntilChanged()
    );
  }

  /**
   * Convenience helper: wraps an observable and automatically increments/decrements
   * around its subscription lifecycle.
   */
  track$<T>(key: string, source$: Observable<T>): Observable<T> {
    return defer(() => {
      this.setBusy(key, true);
      return source$.pipe(finalize(() => this.setBusy(key, false)));
    });
  }

  private publishSnapshot(): void {
    // emit a fresh Map snapshot so subscribers see changes reliably
    this._state$.next(new Map(this.counts));
  }

  private emitChange(key: string, previousCount: number, currentCount: number, type: BusyChangeType): void {
    this.changes$.next({
      key,
      type,
      previousCount,
      currentCount,
      busy: currentCount > 0,
    });
  }
}