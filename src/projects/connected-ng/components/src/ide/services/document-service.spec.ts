import { TestBed } from '@angular/core/testing';

import { IdeDocumentService } from './document-service';

describe('DocumentService', () => {
  let service: IdeDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdeDocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
