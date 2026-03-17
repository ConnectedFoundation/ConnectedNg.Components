import { Component, inject, Injector, input, OnInit, OnDestroy, viewChildren } from '@angular/core';
import { STACK_PAGE, STACK_SHELL, StackNavigationContext, StackPageInfo } from '../services/stack-navigation-context';
import { StackPage } from "../stack-page/stack-page";

@Component({
  selector: 'cn-stack-navigation-shell',
  imports: [StackPage],
  templateUrl: './stack-navigation-shell.html',
  styleUrl: './stack-navigation-shell.scss',
  providers: [
    StackNavigationContext,
    { provide: STACK_SHELL, useExisting: StackNavigationShell }
  ]
})
export class StackNavigationShell implements OnInit, OnDestroy {
  navigationContext = inject(StackNavigationContext);

  globalInjector = inject(Injector);

  rootPage = input.required<StackPageInfo<unknown>>();

  childPages = input<StackPageInfo<unknown>[]>([]);

  /**
   * Optional URL path segments to reconstruct navigation from.
   * Used to restore navigation state from the browser URL.
   */
  urlSegments = input<string[]>([]);

  /**
   * Controls whether this shell manages the browser URL.
   * Set to false for nested shells that should not affect the URL.
   * Defaults to true.
   */
  managesUrl = input<boolean>(true);

  stackPages = viewChildren(StackPage);

  ngOnInit() {
    // Configure the navigation context with URL management setting
    this.navigationContext.setManagesUrl(this.managesUrl());
  }

  getStackPage(pageInfo: StackPageInfo<unknown>) {
    return this.stackPages()?.find(e => e.pageInfo() == pageInfo) ?? this.stackPages()?.find(e => e.pageInfo()?.key == pageInfo.key);
  }

  ngAfterViewInit() {
    const segments = this.urlSegments();
    const root = this.rootPage();

    if (segments && segments.length > 0) {
      // Reconstruct navigation from URL
      this.navigationContext.reconstructFromUrl(segments, root);
    } else {
      // Just navigate to root page
      this.navigationContext.push(root);
    }

    // Initialize browser back/forward navigation handling
    this.navigationContext.initializeBrowserNavigation(root);
  }

  ngOnDestroy() {
    // Clean up browser navigation subscription
    this.navigationContext.destroyBrowserNavigation();
  }
}
