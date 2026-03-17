import { TestBed } from '@angular/core/testing';

import { CodeListContextService } from './code-list-context-service';

describe('CodeListContextService', () => {
  let service: CodeListContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodeListContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
