import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeDocumentEditor } from './ide-document-editor';

describe('IdeDocumentEditor', () => {
  let component: IdeDocumentEditor;
  let fixture: ComponentFixture<IdeDocumentEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeDocumentEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeDocumentEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
