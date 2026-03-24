import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { STACK_BASE_PATH } from '@connected-ng/components/navigation';
import { CodeListContainer } from '../../components/code-list-container/code-list-container';
import { CodeListService } from '../../services/code-list-service';

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
        return codeListKey
          ? `management/code-lists/${codeListKey}`
          : 'management/code-lists';
      },
      deps: [ActivatedRoute]
    }
  ]
})
export class CodeListsView {
  codeListService = inject(CodeListService);
  route = inject(ActivatedRoute);

  constructor() {
    this.route.url.pipe(takeUntilDestroyed()).subscribe(url => {
      const codeListKey = url[0]?.path;
      if (codeListKey) {
        const codeList = this.codeListService.codeLists().find(cl => cl.key === codeListKey);
        if (codeList) {
          this.codeListService.selectCodeList(codeList);
        }
      } else {
        this.codeListService.selectCodeListList();
      }
    });
  }
}
