import { Component, computed, Directive, Signal, viewChild } from "@angular/core";
import { FormBase } from "@connected-ng/components/forms";
import { StackComponent, StackPageInfo } from "@connected-ng/components/navigation";
import { CodeListInsertForm } from "../code-list-insert-form/code-list-insert-form";

@Component({
  template: ''
})
export abstract class CodeListLinkFormBase<TDto extends object> {
  componentContainer = viewChild<StackComponent>('componentContainer');
  formComponent = computed(() => this.componentContainer()?.getRenderedComponent<CodeListInsertForm<TDto>>());

  abstract pageInfo: Signal<StackPageInfo<CodeListInsertForm<TDto>>>;

  constructor() {
  }

  static readonly TEMPLATE = `
  <cn-stack-component
  [pageInfo]="pageInfo()"
  #componentContainer
  ></cn-stack-component>`;
}
