import { TestBed } from '@angular/core/testing';

import { CodeListService } from './code-list-service';

describe('CodeListService', () => {
  let service: CodeListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodeListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
