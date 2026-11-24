import { TestBed } from '@angular/core/testing';

// The navigation entry point (../../navigation) is outside src/, where the test runner looks: its own spec files are not run.
// This one sits here and imports the context by its path.
import { POP_NAVIGATION, StackNavigationContext, StackPageInfo } from '../../navigation/src/services/stack-navigation-context';

describe('StackNavigationContext: POP_NAVIGATION on a pushed page', () => {
  class Dummy {}
  const page = (key: string, outputs?: StackPageInfo<unknown>['outputs']): StackPageInfo<unknown> => ({ component: Dummy, data: {}, key, outputs });
  let service: StackNavigationContext;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StackNavigationContext] });
    service = TestBed.inject(StackNavigationContext);
  });

  it('is bound to a pop, as it is on a page rebuilt from the address', () => {
    service.push(page('list'));
    service.push(page('new', { formClose: POP_NAVIGATION }));

    const formClose = service.activePage()!.outputs!['formClose'];
    expect(typeof formClose).toBe('function');
    (formClose as () => void)();

    expect(service.stack().map((p) => p.key)).toEqual(['list']);
  });

  it('leaves a handler function as it is and does not touch a page without outputs', () => {
    const handler = () => undefined;
    service.push(page('list'));
    service.push(page('edit', { formClose: handler }));
    expect(service.activePage()!.outputs!['formClose']).toBe(handler);

    service.push(page('other'));
    expect(service.activePage()!.outputs).toBeUndefined();
  });
});
