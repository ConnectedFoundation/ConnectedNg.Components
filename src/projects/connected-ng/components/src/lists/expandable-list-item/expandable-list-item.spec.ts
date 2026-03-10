import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandableListItem } from './expandable-list-item';

describe('ExpandableListItem', () => {
  let component: ExpandableListItem;
  let fixture: ComponentFixture<ExpandableListItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandableListItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpandableListItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
