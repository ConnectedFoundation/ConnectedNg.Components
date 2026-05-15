import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeListLinkForm } from './code-list-link-form';

describe('CodeListLinkForm', () => {
  let component: CodeListLinkForm;
  let fixture: ComponentFixture<CodeListLinkForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeListLinkForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeListLinkForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
