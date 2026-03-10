import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingActionBar } from './floating-action-bar';

describe('FloatingActionBar', () => {
  let component: FloatingActionBar;
  let fixture: ComponentFixture<FloatingActionBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingActionBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingActionBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
