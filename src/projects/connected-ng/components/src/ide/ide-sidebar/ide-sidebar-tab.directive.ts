import { Directive, input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[cfIdeSidebarTab]',
  standalone: true
})
export class IdeSidebarTabDirective {
  cfIdeSidebarTab = input.required<string>(); // Tab ID
  label = input.required<string>();
  icon = input.required<string>();
  disabled = input<boolean>(false);

  constructor(public templateRef: TemplateRef<any>) { }
}
