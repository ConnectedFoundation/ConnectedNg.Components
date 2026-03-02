import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdeSidebar } from './ide-sidebar';

describe('IdeSidebar', () => {
  let component: IdeSidebar;
  let fixture: ComponentFixture<IdeSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeSidebar]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IdeSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
