import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[cfIdeExplorerTemplate]',
  standalone: true,
})
export class IdeExplorerTemplateDirective {
  @Input('cfIdeExplorerTemplate') templateKey!: string | ((item: any) => boolean);
  constructor(public templateRef: TemplateRef<any>) { }
}
