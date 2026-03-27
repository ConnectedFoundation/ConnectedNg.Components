import { computed, Injectable, signal } from '@angular/core';
import { EmptyPage, StackPageInfo } from '@connected-ng/components/navigation';
import { CodeLists } from '../components/code-lists/code-lists';
import { routePattern } from '@connected-ng/core';
export interface CodeListStackPageInfo extends StackPageInfo<undefined> {
  title: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CodeListService {
  codeLists = signal<CodeListStackPageInfo[]>([]);

  activeCodeList = signal<CodeListStackPageInfo>({ ...EmptyPage, title: '' });

  /**
   * The root page for the code-lists stack navigation.
   * Always has all registered code lists as childPages.
   * Used so that direct URL navigation always starts from the code-lists root.
   */
  codeListsRootPage = computed<CodeListStackPageInfo>(() => ({
    component: CodeLists,
    key: '/',
    title: 'Code lists',
    childPages: this.codeLists(),
    icon: 'settings',
    pattern: routePattern('/').pattern,
    data: undefined
  }));

  registerCodeList(codeList: CodeListStackPageInfo) {
    this.codeLists.set([...this.codeLists(), codeList].sort((a, b) => a.title.localeCompare(b.title)));
  }

  selectCodeList(codeList: CodeListStackPageInfo) {
    this.activeCodeList.set(codeList);
  }

  selectCodeListList() {
    this.activeCodeList.set({
      component: CodeLists,
      key: '/',
      title: 'Code lists',
      childPages: this.codeLists(),
      icon: 'settings',
      pattern: routePattern('/').pattern,
      data: {}
    });
  }
}
