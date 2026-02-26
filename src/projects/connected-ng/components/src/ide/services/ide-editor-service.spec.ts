import { TestBed } from '@angular/core/testing';

import { IdeEditorService } from './ide-editor-service';

describe('IdeEditorService', () => {
  let service: IdeEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdeEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
