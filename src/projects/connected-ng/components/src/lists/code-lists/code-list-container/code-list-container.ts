import { Component, input, signal } from '@angular/core';
import { StackNavigationShell } from '../../../navigation/stack-navigation-shell/stack-navigation-shell';
import { EmptyPage, StackPageInfo } from '../../../navigation/services/stack-navigation-context';

@Component({
  selector: 'cn-code-list-container',
  imports: [StackNavigationShell],
  templateUrl: './code-list-container.html',
  styleUrl: './code-list-container.scss',
})
export class CodeListContainer {
  rootPage = input<StackPageInfo<unknown>>(EmptyPage);
}
