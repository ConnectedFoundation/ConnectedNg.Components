import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationList } from './navigation-list';

describe('NavigationList', () => {
  let component: NavigationList;
  let fixture: ComponentFixture<NavigationList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
