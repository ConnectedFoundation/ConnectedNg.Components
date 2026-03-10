import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackPage } from './stack-page';

describe('StackPage', () => {
  let component: StackPage;
  let fixture: ComponentFixture<StackPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StackPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
