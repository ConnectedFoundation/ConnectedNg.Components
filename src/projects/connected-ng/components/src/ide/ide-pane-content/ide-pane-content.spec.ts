import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdePaneContent } from './ide-pane-content';

describe('IdePaneContent', () => {
  let component: IdePaneContent;
  let fixture: ComponentFixture<IdePaneContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdePaneContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdePaneContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
