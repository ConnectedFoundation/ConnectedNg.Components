import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeListActionsContainer } from './code-list-actions-container';

describe('CodeListActionsContainer', () => {
  let component: CodeListActionsContainer;
  let fixture: ComponentFixture<CodeListActionsContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeListActionsContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeListActionsContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
