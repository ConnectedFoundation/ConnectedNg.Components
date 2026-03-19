import { Component, ComponentRef, computed, effect, inject, Injector, input, OnDestroy, OnInit, signal, StaticProvider, viewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { IdeDocumentService as IdeDocumentService, IdeDocument, documentsEqual } from '../services/document-service';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { IdeEditorService } from '../services/ide-editor-service';
import { SelectedItem as SelectedItem, SelectionService } from '../services/selection-service';
import { Subscription } from 'rxjs';
import { MatIcon } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'cf-ide-document-editor',
  imports: [MatTabsModule, CdkPortalOutlet, MatIcon, MatButtonModule],
  templateUrl: './ide-document-editor.html',
  styleUrl: './ide-document-editor.scss',
})
export class IdeDocumentEditor implements OnInit, OnDestroy {
  portalOutlet = viewChild<CdkPortalOutlet>(CdkPortalOutlet);
  context = input<string>();

  documentService = inject(IdeDocumentService);
  selectionService = inject(SelectionService);

  editorService = inject(IdeEditorService);
  injector = inject(Injector);

  activeEditorInstances = signal<IdeDocument[]>([]);
  selectedEditorInstance = signal<IdeDocument | undefined>(undefined);

  editorPortal = signal<ComponentPortal<unknown> | undefined>(undefined);

  private subscriptions = new Subscription();

  constructor() {
    // Update editorPortal when selectedEditorInstance changes
    effect(() => {
      const doc = this.selectedEditorInstance();
      console.log('[IdeDocumentEditor] Effect 1: selectedEditorInstance changed to', doc?.id);

      if (doc) {
        console.log('[IdeDocumentEditor] Calling resolveEditor for', doc.id);
        this.editorService.resolveEditor({ ...doc, context: this.context() }).subscribe((editor) => {
          console.log('[IdeDocumentEditor] resolveEditor returned for', doc.id);
          if (editor) {
            const newPortal = new ComponentPortal(editor);
            this.editorPortal.set(newPortal);
          } else {
            this.editorPortal.set(undefined);
          }
        });
      } else {
        this.editorPortal.set(undefined);
      }
    });

    // Set input when portal is ready and we have a document that hasn't been set
    effect(() => {
      const portal = this.editorPortal();
      const doc = this.selectedEditorInstance();
      console.log('[IdeDocumentEditor] Effect 2: portal or doc changed. portal=', !!portal, 'doc=', doc?.id);

      if (portal && doc) {
        console.log('[IdeDocumentEditor] Setting ideDocument input for', doc.id);
        // Wait for next tick to ensure portal is attached
        setTimeout(() => {
          const outlet = this.portalOutlet();
          if (outlet?.attachedRef) {
            const componentRef = outlet.attachedRef as ComponentRef<any>;
            componentRef.setInput('ideDocument', doc);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  ngOnInit() {
    if (this.selectionService.$selected) {
      this.subscriptions.add(
        this.selectionService.$selected.subscribe((e: SelectedItem) => {
          console.log('[IdeDocumentEditor] Received selection:', e.id, 'from', e.currentEditor);
          // Don't reprocess selections from ourselves to avoid loops
          if (e.currentEditor === 'IdeDocumentEditor') return;
          this.selectDocument(e);
        })
      );
    }
  }

  selectDocument(selectedItem: SelectedItem) {
    console.log('[IdeDocumentEditor] selectDocument called for', selectedItem.id);
    this.documentService.select(selectedItem).subscribe((document) => {
      console.log('[IdeDocumentEditor] documentService.select returned for', selectedItem.id);
      if (!document)
        return;

      let existing = this.activeEditorInstances().find(e => documentsEqual(e, document));

      if (existing) {
        console.log('[IdeDocumentEditor] Setting existing instance');
        this.selectedEditorInstance.set(existing as IdeDocument);
      } else {
        console.log('[IdeDocumentEditor] Adding new instance');
        this.activeEditorInstances.set([...this.activeEditorInstances(), document]);
        this.selectedEditorInstance.set(document);
      }
    });
  }

  onTabClick(document: IdeDocument) {
    console.log('[IdeDocumentEditor] onTabClick for', document.id);
    this.selectedEditorInstance.set(document);

    // Notify the selection service
    const selectedItem: SelectedItem = {
      id: document.id,
      type: document.type,
      project: document.project,
      context: this.context(),
      currentEditor: 'IdeDocumentEditor'
    };
    this.selectionService.select(selectedItem);
  }

  closeDocument(document: IdeDocument) {
    let existing = this.activeEditorInstances().find(e => documentsEqual(e, document));
    if (existing) {
      if (this.selectedEditorInstance() && documentsEqual(this.selectedEditorInstance()!, document)) {
        this.selectedEditorInstance.set(undefined);
      }

      this.activeEditorInstances.set(this.activeEditorInstances().filter(e => !documentsEqual(e, document)));
    }
  }

  onCloseDocument(document: IdeDocument) {
    this.closeDocument(document);
    this.documentService.close(document);
  }

  isDocumentSelected(document: IdeDocument): boolean {
    const selected = this.selectedEditorInstance();
    return selected ? documentsEqual(selected, document) : false;
  }
}

