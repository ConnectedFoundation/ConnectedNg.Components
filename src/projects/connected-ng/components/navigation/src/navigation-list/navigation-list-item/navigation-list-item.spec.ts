import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationListItem } from './navigation-list-item';

describe('NavigationListItem', () => {
  let component: NavigationListItem;
  let fixture: ComponentFixture<NavigationListItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationListItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationListItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
