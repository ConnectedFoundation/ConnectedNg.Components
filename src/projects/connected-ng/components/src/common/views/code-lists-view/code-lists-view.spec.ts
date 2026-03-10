import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeListsView } from './code-lists-view';

describe('CodeListsView', () => {
  let component: CodeListsView;
  let fixture: ComponentFixture<CodeListsView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeListsView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeListsView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
