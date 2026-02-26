import { TestBed } from '@angular/core/testing';

import { IdeLayoutService } from './ide-layout-service';

describe('IdeLayoutService', () => {
  let service: IdeLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdeLayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
