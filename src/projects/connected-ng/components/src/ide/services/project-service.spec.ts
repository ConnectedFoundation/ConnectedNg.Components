import { TestBed } from '@angular/core/testing';
import { IdeProjectService } from './project-service';

describe('ProjectService', () => {
  let service: IdeProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdeProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
