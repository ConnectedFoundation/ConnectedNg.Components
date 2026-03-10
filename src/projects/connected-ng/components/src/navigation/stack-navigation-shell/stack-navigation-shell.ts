import { Component, inject, Injector, input, OnInit } from '@angular/core';
import { STACK_PAGE, StackNavigationContext, StackPageInfo } from '../services/stack-navigation-context';
import { StackPage } from "../stack-page/stack-page";

@Component({
  selector: 'cn-stack-navigation-shell',
  imports: [StackPage],
  templateUrl: './stack-navigation-shell.html',
  styleUrl: './stack-navigation-shell.scss',
  providers: [
    StackNavigationContext
  ]
})
export class StackNavigationShell implements OnInit {
  navigationContext = inject(StackNavigationContext);

  globalInjector = inject(Injector);

  rootPage = input.required<StackPageInfo<unknown>>();

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.navigationContext.push(this.rootPage());
  }
}
