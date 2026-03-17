import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IdePropertyPane } from './ide-property-pane';
import { IdeEditorPropertyService, EDITOR_PROPERTY_SERVICE_CONFIG, EditorPropertyServiceConfiguration } from '../services/editor-property-service';
import { SelectionService, SELECTION_SERVICE_CONFIG, SelectionServiceConfiguration } from '../services/selection-service';
import { UrlService } from '@connected-ng/core';

describe('IdePropertyPane', () => {
  let component: IdePropertyPane;
  let fixture: ComponentFixture<IdePropertyPane>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IdePropertyPane,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        IdeEditorPropertyService,
        SelectionService,
        UrlService,
        {
          provide: EDITOR_PROPERTY_SERVICE_CONFIG,
          useValue: new EditorPropertyServiceConfiguration()
        },
        {
          provide: SELECTION_SERVICE_CONFIG,
          useValue: new SelectionServiceConfiguration()
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IdePropertyPane);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no item is selected', () => {
    const compiled = fixture.nativeElement;
    const emptyState = compiled.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });
});
