import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeListEditForm } from './code-list-edit-form';

describe('CodeListEditForm', () => {
  let component: CodeListEditForm;
  let fixture: ComponentFixture<CodeListEditForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeListEditForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeListEditForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
