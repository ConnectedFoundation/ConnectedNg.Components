import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdeExplorer } from './ide-explorer';

describe('IdeExplorer', () => {
  let component: IdeExplorer<any>;
  let fixture: ComponentFixture<IdeExplorer<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeExplorer]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IdeExplorer);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('metaFunction', () => ({ id: '1', parentId: null, templateKey: 'test' }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
