import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[cfIdeToolboxTemplate]',
  standalone: true,
})
export class IdeToolboxTemplateDirective {
  @Input('cfIdeToolboxTemplate') templateKey!: string | ((item: any) => boolean);
  constructor(public templateRef: TemplateRef<any>) { }
}
