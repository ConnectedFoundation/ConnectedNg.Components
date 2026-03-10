import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionTile } from './action-tile';

describe('ActionTile', () => {
  let component: ActionTile;
  let fixture: ComponentFixture<ActionTile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionTile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionTile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
