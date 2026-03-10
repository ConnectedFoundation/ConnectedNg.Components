import { Component, inject } from '@angular/core';
import { CodeListContainer } from "../../../lists/code-lists/code-list-container/code-list-container";
import { CodeListService } from './services/code-list-service';

@Component({
  selector: 'cn-code-lists-view',
  imports: [CodeListContainer],
  templateUrl: './code-lists-view.html',
  styleUrl: './code-lists-view.scss',
})
export class CodeListsView {
  codeListService = inject(CodeListService);
}
