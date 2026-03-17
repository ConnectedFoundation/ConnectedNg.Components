import { Injectable, signal } from '@angular/core';
import { EmptyPage, StackPageInfo } from '@connected-ng/components';

export interface CodeListStackPageInfo extends StackPageInfo<undefined> {
  title: string;
}

@Injectable({
  providedIn: 'root',
})
export class CodeListService {
  codeLists = signal<CodeListStackPageInfo[]>([]);

  activeCodeList = signal<CodeListStackPageInfo>({ ...EmptyPage, title: '' });

  registerCodeList(codeList: CodeListStackPageInfo) {
    this.codeLists.set([...this.codeLists(), codeList].sort((a, b) => a.title.localeCompare(b.title)));
  }

  selectCodeList(codeList: CodeListStackPageInfo) {
    this.activeCodeList.set(codeList);
  }
}
