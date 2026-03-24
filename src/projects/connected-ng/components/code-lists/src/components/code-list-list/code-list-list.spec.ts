import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeListList } from './code-list-list';

describe('CodeListList', () => {
  let component: CodeListList;
  let fixture: ComponentFixture<CodeListList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeListList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeListList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
