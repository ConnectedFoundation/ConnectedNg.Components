import { Component, inject } from '@angular/core';
import { CodeListList } from '../code-list-list/code-list-list';
import { CodeListService, CodeListStackPageInfo } from '../../services/code-list-service';
import { StackNavigationContext } from '@connected-ng/components/navigation';

@Component({
  selector: 'cn-code-lists',
  imports: [CodeListList],
  templateUrl: './code-lists.html',
  styleUrl: './code-lists.scss',
})
export class CodeLists {
  codeListService = inject(CodeListService);
  navigationContext = inject(StackNavigationContext);

  readonly filter = (item: CodeListStackPageInfo, query: string) =>
    item.title.toLowerCase().includes(query);

  openCodeList(item: CodeListStackPageInfo) {
    this.navigationContext.push(item);
  }
}
