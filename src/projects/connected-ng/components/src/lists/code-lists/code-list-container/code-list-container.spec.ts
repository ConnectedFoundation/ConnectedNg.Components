import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeListContainer } from './code-list-container';

describe('CodeListContainer', () => {
  let component: CodeListContainer;
  let fixture: ComponentFixture<CodeListContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeListContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeListContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
