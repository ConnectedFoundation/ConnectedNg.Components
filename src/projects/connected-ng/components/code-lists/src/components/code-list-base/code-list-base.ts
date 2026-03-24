import { Directive, inject, Injector, OnDestroy, signal } from "@angular/core";
import { StackNavigationContext } from "@connected-ng/components/navigation";
import { CodeListAction, CodeListActions } from "../code-list-actions-container/code-list-actions";
import { Subscription } from "rxjs";

@Directive()
export abstract class CodeListBase implements OnDestroy {
  navigationContext = inject(StackNavigationContext);
  injector = inject(Injector);

  protected subscriptions = new Subscription();

  codeListActions = signal<CodeListAction[]>([]);

  ngOnInit() {
    if ((this.navigationContext.stack()?.[0] ?? undefined) != this.navigationContext.activePage()) {
      this.codeListActions.update((items) => {
        items = [
          CodeListActions.backAction(() => this.navigationContext.pop()),
          ...items];

        return items;
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
