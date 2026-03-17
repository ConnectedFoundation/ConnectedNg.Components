import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeListSelectBox } from './code-list-select-box';

describe('CodeListSelectBox', () => {
  let component: CodeListSelectBox;
  let fixture: ComponentFixture<CodeListSelectBox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeListSelectBox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeListSelectBox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
