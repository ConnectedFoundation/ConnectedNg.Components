import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusyWrapper } from './busy-wrapper';

describe('BusyWrapper', () => {
  let component: BusyWrapper;
  let fixture: ComponentFixture<BusyWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusyWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusyWrapper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});