import { Component, ComponentRef, computed, Directive, inject, input, Type, viewChild } from '@angular/core';
import { STACK_SHELL, StackNavigationContext, StackPageInfo } from '../services/stack-navigation-context';
import { StackNavigationShell } from "../stack-navigation-shell/stack-navigation-shell";

@Component({
  selector: 'cn-stack-component',
  template: `
  @if (needsShell()) {
    <cn-stack-navigation-shell #shell [rootPage]="pageInfo()" [childPages]="childPagesInfo()" [managesUrl]="false">
    </cn-stack-navigation-shell>
  }
 `,
  imports: [StackNavigationShell],

})
export class StackComponent<TData = any> {
  private privateShell = viewChild<StackNavigationShell>('shell');

  pageInfo = input.required<StackPageInfo<TData>>();
  childPagesInfo = input<StackPageInfo<TData>[]>([]);

  protected navigationContext = inject(StackNavigationContext, { optional: true });

  protected parentShell = inject(STACK_SHELL, { optional: true });

  shell = computed<StackNavigationShell>(() => this.needsShell() ? this.privateShell() : this.parentShell);

  needsShell = computed(() => this.navigationContext === null);

  getRenderedComponent<T>() {
    return this.shell()?.getStackPage(this.pageInfo())?.getRenderedComponent<T>();
  }

  ngOnInit() {
    if (!this.needsShell())
      this.navigationContext?.push(this.pageInfo());
  }
}
