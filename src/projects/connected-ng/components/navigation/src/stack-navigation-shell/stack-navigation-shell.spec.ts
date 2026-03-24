import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackNavigationShell } from './stack-navigation-shell';

describe('StackNavigationShell', () => {
  let component: StackNavigationShell;
  let fixture: ComponentFixture<StackNavigationShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackNavigationShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StackNavigationShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
