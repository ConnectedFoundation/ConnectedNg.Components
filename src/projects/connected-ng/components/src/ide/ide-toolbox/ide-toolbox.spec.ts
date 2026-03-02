import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdeToolbox } from './ide-toolbox';

describe('IdeToolbox', () => {
  let component: IdeToolbox;
  let fixture: ComponentFixture<IdeToolbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeToolbox]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IdeToolbox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
