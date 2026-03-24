import { TestBed } from '@angular/core/testing';

import { StackNavigationContext } from './stack-navigation-context';

describe('StackNavigationContext', () => {
  let service: StackNavigationContext;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StackNavigationContext);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
