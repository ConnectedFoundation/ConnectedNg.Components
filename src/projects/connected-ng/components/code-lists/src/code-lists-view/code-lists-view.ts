import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { STACK_BASE_PATH } from '@connected-ng/components';
import { CodeListContainer } from '../code-list-container/code-list-container';
import { CodeListService } from '../services/code-list-service';

@Component({
  selector: 'cn-code-lists-view',
  imports: [CodeListContainer],
  templateUrl: './code-lists-view.html',
  styleUrl: './code-lists-view.scss',
  providers: [
    {
      provide: STACK_BASE_PATH,
      useFactory: (route: ActivatedRoute) => {
        const codeListKey = route.snapshot.url[0]?.path;
        const basePath = codeListKey
          ? `management/code-lists/${codeListKey}`
          : 'management/code-lists';
        console.log('[CodeListsView] STACK_BASE_PATH:', basePath, 'url:', route.snapshot.url.map(s => s.path));
        return basePath;
      },
      deps: [ActivatedRoute]
    }
  ]
})
export class CodeListsView {
  codeListService = inject(CodeListService);
  route = inject(ActivatedRoute);

  constructor() {
    // Select the active code list based on URL on initialization
    console.log('[CodeListsView] constructor, url:', this.route.snapshot.url.map(s => s.path));
    this.selectCodeListFromUrl();
  }

  private selectCodeListFromUrl() {
    const url = this.route.snapshot.url;
    if (url && url.length > 0) {
      // First segment after 'management/code-lists' is the code list key
      const codeListKey = url[0]?.path;
      console.log('[CodeListsView] selectCodeListFromUrl, key:', codeListKey);
      if (codeListKey) {
        const codeList = this.codeListService.codeLists().find(cl => cl.key === codeListKey);
        if (codeList) {
          console.log('[CodeListsView] Found and selected code list:', codeList.key);
          this.codeListService.selectCodeList(codeList);
        } else {
          console.warn('[CodeListsView] Code list not found for key:', codeListKey, 'available:', this.codeListService.codeLists().map(cl => cl.key));
        }
      }
    }
  }
}
