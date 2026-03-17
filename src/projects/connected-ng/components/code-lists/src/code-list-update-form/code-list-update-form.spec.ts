import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeListUpdateForm } from './code-list-update-form';

describe('CodeListUpdateForm', () => {
  let component: CodeListUpdateForm;
  let fixture: ComponentFixture<CodeListUpdateForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeListUpdateForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeListUpdateForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
