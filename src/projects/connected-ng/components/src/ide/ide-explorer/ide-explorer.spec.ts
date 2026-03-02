import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdeExplorer } from './ide-explorer';
import { IdeExplorerItemService, EXPLORER_ITEM_SERVICE_CONFIG } from '../services/explorer-item-service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('IdeExplorer', () => {
  let component: IdeExplorer<any>;
  let fixture: ComponentFixture<IdeExplorer<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeExplorer],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        IdeExplorerItemService,
        {
          provide: EXPLORER_ITEM_SERVICE_CONFIG,
          useValue: { baseUrl: () => 'http://localhost' }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IdeExplorer);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('session', 'test-session');
    fixture.componentRef.setInput('context', 'test-context');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
