import { Component, inject, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { AngularSplitModule } from 'angular-split';
import { CdkPortalOutlet } from "@angular/cdk/portal";
import { IdeLayoutService } from './services/ide-layout-service';
import { IdePaneContent } from './ide-pane-content/ide-pane-content';
import { IdeDocumentEditor } from "./ide-document-editor/ide-document-editor";

@Component({
  selector: 'cf-ide',
  imports: [
    MatDividerModule,
    AngularSplitModule,
    CdkPortalOutlet,
    IdePaneContent,
    IdeDocumentEditor
  ],
  templateUrl: './ide.html',
  styleUrl: './ide.scss',
})
export class Ide {
  layoutService = inject(IdeLayoutService);
  context = input<string>();
}