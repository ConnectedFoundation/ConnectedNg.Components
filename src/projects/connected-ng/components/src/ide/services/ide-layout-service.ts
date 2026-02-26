import { Portal } from '@angular/cdk/portal';
import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IdeLayoutService {
  //#region Left pane
  leftPane = signal<IdePane>(new IdePane());
  //#endregion

  //#region Right pane
  rightPane = signal<IdePane>(new IdePane());
  //#endregion

  //#region Bottom pane
  bottomPane = signal<IdePane>(new IdePane());
  //#endregion
}

export class IdePane {
  readonly visible = signal<boolean>(false);
  readonly portal = signal<Portal<unknown> | null | undefined>(null);
  readonly hasPortal = computed(() => !!this.portal());

  toggleVisible() {
    this.visible.set(!this.visible());
  }

  show() {
    this.visible.set(true);
  }

  hide() {
    this.visible.set(false);
  }

  setContent(content: Portal<unknown>) {
    this.portal.set(content);
  }

  unsetContent() {
    this.portal.set(null);
  }
}

