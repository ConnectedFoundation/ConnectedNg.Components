import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeLists } from './code-lists';

describe('CodeLists', () => {
  let component: CodeLists;
  let fixture: ComponentFixture<CodeLists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeLists]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeLists);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
