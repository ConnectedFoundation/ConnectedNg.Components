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

  it('closes its own page when it fires after another page was pushed on top', () => {
    service.push(page('list'));
    service.push(page('new', { formClose: POP_NAVIGATION }));
    const formClose = service.activePage()!.outputs!['formClose'] as () => void;
    service.push(page('other'));

    formClose();

    expect(service.stack().map((p) => p.key)).toEqual(['list']);
  });

  it('does nothing when its page is no longer in the stack', () => {
    service.push(page('list'));
    service.push(page('new', { formClose: POP_NAVIGATION }));
    const formClose = service.activePage()!.outputs!['formClose'] as () => void;
    service.pop();
    service.push(page('other'));

    formClose();

    expect(service.stack().map((p) => p.key)).toEqual(['list', 'other']);
  });

  it('follows the Back rules of the page: it returns to the page it was navigated from', () => {
    service.push(page('list'));
    service.push(page('middle'));
    const middle = service.activePage()!;
    service.push({ ...page('new', { formClose: POP_NAVIGATION }) });
    service.activePage()!.navigatedFrom = service.stack()[1];

    (service.activePage()!.outputs!['formClose'] as () => void)();

    expect(service.activePage()).toBe(middle);
  });

  it('is recognized by its description, as another copy of the library has its own symbol', () => {
    service.push(page('list'));
    service.push(page('new', { formClose: Symbol('POP_NAVIGATION') }));

    expect(typeof service.activePage()!.outputs!['formClose']).toBe('function');
  });

  it('is bound on a child rebuilt from the address, with a static key or a pattern without a factory', () => {
    const find = (parent: StackPageInfo<unknown>, segments: string[]) => (service as any).findChildBySegments(parent, segments, 0);
    const root: StackPageInfo<unknown> = {
      ...page('root'),
      childPages: [
        page('static', { formClose: POP_NAVIGATION }),
        { ...page('item', { formClose: POP_NAVIGATION }), pattern: 'item/:id' },
      ],
    };

    expect(typeof find(root, ['static']).child.outputs.formClose).toBe('function');
    expect(typeof find(root, ['item', '7']).child.outputs.formClose).toBe('function');
  });
});
