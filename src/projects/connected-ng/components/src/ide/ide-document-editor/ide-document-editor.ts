import { Component, ComponentRef, computed, effect, inject, Injector, signal, StaticProvider, viewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { IdeDocumentService as IdeDocumentService, IdeDocument } from '../services/document-service';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { IdeEditorService } from '../services/ide-editor-service';

@Component({
  selector: 'cf-ide-document-editor',
  imports: [MatTabsModule, CdkPortalOutlet],
  templateUrl: './ide-document-editor.html',
  styleUrl: './ide-document-editor.scss',
})
export class IdeDocumentEditor {
  portalOutlet = viewChild<CdkPortalOutlet>(CdkPortalOutlet);

  documentService = inject(IdeDocumentService);
  editorService = inject(IdeEditorService);
  injector = inject(Injector);

  activeDocuments = signal<IdeDocument[]>([]);
  selectedDocument = signal<IdeDocument | undefined>(undefined);

  editorPortal = computed<ComponentPortal<unknown> | undefined>(() => {
    let doc = this.selectedDocument();

    if (doc) {
      let editor = this.editorService.resolveEditor(doc);

      if (!editor)
        return undefined;

      return new ComponentPortal(editor);
    }

    return undefined;
  });

  constructor() {
    // Set input when portal changes and gets attached
    effect(() => {
      const portal = this.editorPortal();
      const doc = this.selectedDocument();

      if (portal && doc) {
        // Wait for next tick to ensure portal is attached
        setTimeout(() => {
          const outlet = this.portalOutlet();
          if (outlet?.attachedRef) {
            const componentRef = outlet.attachedRef as ComponentRef<any>;
            if (componentRef.instance.document) {
              componentRef.setInput('document', doc);
            }
          }
        });
      }
    });
  }

  ngOnInit() {
    this.documentService.documentSelected$.subscribe(e => this.selectDocument(e));
    this.documentService.documentClosed$.subscribe(e => this.closeDocument(e));
  }

  selectDocument(document: IdeDocument) {
    let editor = this.editorService.resolveEditor(document);

    if (!editor) {
      this.selectedDocument.set(undefined);
      return;
    }

    let existing = this.activeDocuments().find(e => e.equals(document));

    if (existing)
      this.selectedDocument.set(existing as IdeDocument);
    else {
      this.activeDocuments.set([...this.activeDocuments(), document]);
      this.selectedDocument.set(document);
    }
  }

  closeDocument(document: IdeDocument) {
    let existing = this.activeDocuments().find(e => e.equals(document));
    if (existing) {
      if (this.selectedDocument() && this.selectedDocument()?.equals(document)) {
        this.selectedDocument.set(undefined);
      }

      this.activeDocuments.set(this.activeDocuments().filter(e => !e.equals(document)));
    }
  }
}

