import { Injectable, signal } from '@angular/core';
import { EmptyPage, StackPageInfo } from '../../../../navigation/services/stack-navigation-context';

@Injectable({
  providedIn: 'root',
})
export class CodeListService {
  codeLists = signal<StackPageInfo<unknown>[]>([]);

  activeCodeList = signal<StackPageInfo<unknown>>(EmptyPage);

  registerCodeList(codeList: StackPageInfo<unknown>) {
    this.codeLists.set([...this.codeLists(), codeList].sort((a, b) => a.title.localeCompare(b.title)));
  }

  selectCodeList(codeList: StackPageInfo<unknown>) {
    this.activeCodeList.set(codeList);
  }
}
