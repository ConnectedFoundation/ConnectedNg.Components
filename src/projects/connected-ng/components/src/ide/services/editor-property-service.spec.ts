import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IdeEditorPropertyService, EDITOR_PROPERTY_SERVICE_CONFIG, EditorPropertyServiceConfiguration } from './editor-property-service';
import { UrlService } from '@connected-ng/core';

describe('IdeEditorPropertyService', () => {
  let service: IdeEditorPropertyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        IdeEditorPropertyService,
        UrlService,
        {
          provide: EDITOR_PROPERTY_SERVICE_CONFIG,
          useValue: new EditorPropertyServiceConfiguration()
        }
      ]
    });
    service = TestBed.inject(IdeEditorPropertyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
