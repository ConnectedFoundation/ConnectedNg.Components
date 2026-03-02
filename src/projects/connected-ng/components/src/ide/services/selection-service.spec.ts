import { TestBed } from '@angular/core/testing';
import { SelectionService, SELECTION_SERVICE_CONFIG, SelectionServiceConfiguration } from './selection-service';

describe('SelectionService', () => {
  let service: SelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SELECTION_SERVICE_CONFIG,
          useValue: new SelectionServiceConfiguration()
        }
      ]
    });
    service = TestBed.inject(SelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
