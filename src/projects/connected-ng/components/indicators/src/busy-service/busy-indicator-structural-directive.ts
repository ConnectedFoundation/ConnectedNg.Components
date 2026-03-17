import {
  ApplicationRef,
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  Injector,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { ComponentRef } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { BusyWrapper, CfBusyType } from './busy-wrapper/busy-wrapper';
import { BusyService } from './busy-service';

@Directive({
  selector: 'ng-template[busyIndicator]',
  standalone: true,
})
export class BusyIndicatorStructuralDirective implements OnDestroy {
  /** microsyntax main expression: *cfBusy="['a','b']" */
  busyIndicator = input<string[] | string>([]);

  /** microsyntax: type: 'bar' | 'spinner'  -> maps to cfBusyType */
  busyIndicatorType = input<CfBusyType>('bar');

  /** microsyntax: block: true/false -> maps to cfBusyBlock */
  busyIndicatorBlock = input<boolean>(true);

  private readonly busyService = inject(BusyService);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly appRef = inject(ApplicationRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private embedded?: EmbeddedViewRef<unknown>;
  private wrapper?: ComponentRef<BusyWrapper>;
  private sub?: Subscription;

  constructor() {
    this.buildWrapper();

    effect(() => {
      const keys = normalizeKeys(this.busyIndicator());
      const type = this.busyIndicatorType();
      const block = this.busyIndicatorBlock();

      // update presentation immediately
      if (this.wrapper) {
        this.wrapper.setInput('type', type);
        this.wrapper.setInput('block', block);
        this.wrapper.changeDetectorRef.detectChanges();
      }

      // resubscribe to busy keys
      this.resubscribe(keys);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.wrapper?.destroy();
    if (this.embedded) {
      this.appRef.detachView(this.embedded);
      this.embedded.destroy();
    }
  }

  private buildWrapper(): void {
    // Create the embedded view manually without adding it to VCR
    const view = this.tpl.createEmbeddedView(null);
    view.detectChanges();

    // Get the root nodes for projection
    const nodes = (view.rootNodes ?? []) as Node[];

    // Create wrapper component with projected nodes
    // The nodes get moved into the wrapper's <ng-content>
    this.wrapper = this.vcr.createComponent(BusyWrapper, {
      injector: this.injector,
      projectableNodes: [nodes],
    });

    // Attach the view to ApplicationRef so it participates in change detection
    this.appRef.attachView(view);

    // Keep a reference to the view
    this.embedded = view;
  }

  private resubscribe(keys: string[]): void {
    this.sub?.unsubscribe();
    this.sub = undefined;

    if (!this.wrapper) return;

    if (keys.length === 0) {
      this.setActive(false);
      return;
    }

    const streams = keys.map(k => this.busyService.busy$(k).pipe(startWith(false)));

    this.sub = combineLatest(streams).pipe(
      map(list => list.some(Boolean)),
      distinctUntilChanged(),
    ).subscribe(active => this.setActive(active));
  }

  private setActive(active: boolean): void {
    if (!this.wrapper) return;
    this.wrapper.setInput('active', active);
    this.wrapper.changeDetectorRef.detectChanges();
    this.embedded?.detectChanges();
  }
}

function normalizeKeys(v: string[] | string): string[] {
  const arr = Array.isArray(v) ? v : [v];
  return arr.map(x => (x ?? '').trim()).filter(Boolean);
}
