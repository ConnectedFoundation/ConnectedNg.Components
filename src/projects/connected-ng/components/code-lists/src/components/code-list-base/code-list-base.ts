import { computed, Directive, inject, Injector, input, OnDestroy, signal } from "@angular/core";
import { ActionsProviderContract, StackNavigationContext } from "@connected-ng/components/navigation";
import { CodeListAction, CodeListActions } from "../code-list-actions-container/code-list-actions";
import { Subscription } from "rxjs";
import { ActionDescriptionWithAction } from "@connected-ng/components";

@Directive()
export abstract class CodeListBase implements OnDestroy, ActionsProviderContract {
  navigationContext = inject(StackNavigationContext);
  injector = inject(Injector);

  protected subscriptions = new Subscription();

  codeListActions = signal<ActionDescriptionWithAction[]>([]);

  pageActions = computed<ActionDescriptionWithAction[]>(() => this.codeListActions());

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


@Directive()
export abstract class CodeListHeaderBase implements OnDestroy {
  protected subscriptions = new Subscription();

  data = input<any>();

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
