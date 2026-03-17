import { Component, computed, Directive, Signal, viewChild } from "@angular/core";
import { FormBase } from "@connected-ng/components/forms";
import { StackComponent, StackPageInfo } from "@connected-ng/components";
import { CodeListInsertForm } from "../code-list-insert-form/code-list-insert-form";

@Component({
  template: ''
})
export abstract class CodeListInsertFormBase<TDto extends object> extends FormBase<TDto> {
  componentContainer = viewChild<StackComponent>('componentContainer');
  formComponent = computed(() => this.componentContainer()?.getRenderedComponent<CodeListInsertForm<TDto>>());

  abstract pageInfo: Signal<StackPageInfo<CodeListInsertForm<TDto>>>;

  constructor() {
    super();
  }

  override getModel(): TDto {
    return this.formComponent()?.getModel()!;
  }

  static readonly TEMPLATE = `
  <cn-stack-component
  [pageInfo]="pageInfo()"
  #componentContainer
  ></cn-stack-component>`;
}
