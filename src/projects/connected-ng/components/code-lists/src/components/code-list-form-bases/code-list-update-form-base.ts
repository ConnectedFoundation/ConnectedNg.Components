import { Component, computed, Directive, input, signal, Signal, viewChild } from "@angular/core";
import { FormBase } from "@connected-ng/components/forms";
import { StackComponent, StackPageInfo } from "@connected-ng/components/navigation";
import { CodeListInsertForm } from "../code-list-insert-form/code-list-insert-form";
import { Observable } from "rxjs";

@Component({
  template: ''
})
export abstract class CodeListUpdateFormBase<TDto extends object, TEntity> extends FormBase<TDto> {
  componentContainer = viewChild<StackComponent>('componentContainer');
  formComponent = computed(() => this.componentContainer()?.getRenderedComponent<CodeListInsertForm<TDto>>());

  dto = signal<TEntity | undefined>(undefined);

  entityLoader = input.required<Observable<TEntity>>();

  abstract pageInfo: Signal<StackPageInfo<CodeListInsertForm<TDto>> | undefined>;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.entityLoader().subscribe(result => this.dto.set(result));
  }

  override getModel(): TDto {
    return this.formComponent()?.getModel()!;
  }

  static readonly TEMPLATE = `
  @if (pageInfo()) {
  <cn-stack-component
    [pageInfo]="pageInfo()!"
    #componentContainer
  ></cn-stack-component>
}`;
}
