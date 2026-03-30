import { Component, computed, inject, Injectable, InjectionToken, signal, Type } from '@angular/core';
import { LocationStrategy } from '@angular/common';

export const STACK_PAGE = new InjectionToken<StackPageInfo<unknown>>('STACK_PAGE');
export const STACK_SHELL = new InjectionToken<any>('STACK_SHELL');
export const STACK_BASE_PATH = new InjectionToken<string>('STACK_BASE_PATH');

/**
 * Special marker for output handlers that should pop the navigation stack.
 * Use this in childPages definitions when you want formClose to automatically pop.
 */
export const POP_NAVIGATION = Symbol('POP_NAVIGATION');

export interface StackPageNavigationInfo<T> extends StackPageInfo<T> {
  navigatedFrom?: StackPageInfo<unknown>;
}

@Injectable()
export class StackNavigationContext {
  private locationStrategy = inject(LocationStrategy, { optional: true });
  private basePath = inject(STACK_BASE_PATH, { optional: true }) ?? '';
  private _managesUrl = true;
  private popstateHandler?: (event: PopStateEvent) => void;
  private handlingPopstate = false;

  stack = signal<StackPageNavigationInfo<unknown>[]>([]);
  private skipUrlUpdate = false;

  activePage = computed(() => {
    let newActive = this.stack().at(-1);
    return newActive;
  });

  constructor() {
  }

  /**
   * Sets whether this context should manage browser URL updates.
   * Called by StackNavigationShell during initialization.
   */
  setManagesUrl(value: boolean) {
    this._managesUrl = value;
  }

  /**
   * Initializes browser back/forward navigation handling.
   * Must be called with the root page after navigation context is set up.
   */
  initializeBrowserNavigation(rootPage: StackPageInfo<unknown>) {
    if (!this._managesUrl) {
      return;
    }

    // Listen to native popstate directly so Angular's router never sees the event.
    this.popstateHandler = (event: PopStateEvent) => {
      // Immediately undo the browser's back/forward by pushing the current
      // stack URL back into history. This cancels the browser's navigation
      // so Angular's router never processes the stale URL.
      const correctUrl = this.getFullUrl();
      this.handlingPopstate = true;

      if (event.state?.stackForward) {
        // Forward navigation: reconstruct from the URL the browser navigated to
        const forwardUrl = window.location.pathname;
        let relativePath = forwardUrl;
        const basePrefix = this.locationStrategy ? this.locationStrategy.getBaseHref() : '/';
        if (basePrefix && basePrefix !== '/' && relativePath.startsWith(basePrefix)) {
          relativePath = relativePath.substring(basePrefix.length);
        }
        if (this.basePath && relativePath.startsWith('/' + this.basePath)) {
          relativePath = relativePath.substring(('/' + this.basePath).length);
        }
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1);
        }
        const segments = relativePath.split('/').filter(s => s.length > 0);
        if (segments.length > 0) {
          this.skipUrlUpdate = true;
          this.reconstructFromUrl(segments, rootPage);
          this.skipUrlUpdate = false;
          // Replace the current entry so it has our stack marker
          this.nativeReplaceState(this.getFullUrl());
        }
      } else {
        // Back navigation: undo the browser's navigation, then run our back() logic
        history.pushState({ stackNav: true }, '', correctUrl);
        if (this.stack().length > 1) {
          this.back();
        }
      }

      this.handlingPopstate = false;
    };

    window.addEventListener('popstate', this.popstateHandler);
  }

  back() {
    if (this.activePage()?.navigatedFrom) {
      this.popTo(this.activePage()!.navigatedFrom!);
    } else {
      this.pop(this.activePage()?.backStep ?? 1);
    }
  }

  popTo(page: StackPageInfo<unknown>) {
    const stack = this.stack();
    // Search from second-to-last backwards (exclude the active page itself)
    const parents = stack.slice(0, -1);
    let targetIndex = -1;
    for (let i = parents.length - 1; i >= 0; i--) {
      if (parents[i] === page || parents[i].key === page.key) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) {
      console.warn('[StackNavigationContext] popTo: page not found in stack, doing nothing.', { page, stack });
      return;
    }

    this.stack.update(s => s.slice(0, targetIndex + 1));
    this.updateUrl();
  }

  /**
   * Cleans up browser navigation subscription.
   */
  destroyBrowserNavigation() {
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = undefined;
    }
  }

  push(...pages: StackPageInfo<unknown>[]) {
    let activePage = this.activePage();
    this.stack.set([...this.stack(), ...pages.map(e => ({ ...e, navigatedFrom: activePage }))]);
    this.updateUrl();
  }

  pop(count = 1) {
    if (this.stack().length > count) {
      this.stack.update((stack) => {
        return stack.slice(0, -count);
      });
      this.updateUrl();
    }
  }

  /**
   * Generates a URL path from the current stack (without base href)
   */
  getUrlFromStack(): string {
    const keys = this.stack()
      .slice(1) // Skip root page
      .map(page => page.key)
      .filter(key => key && key.length > 0);

    const path = keys.length > 0 ? keys.join('/') : '';

    if (!this.basePath) {
      return path;
    }

    return path ? `${this.basePath}/${path}` : this.basePath;
  }

  /**
   * Gets the full URL including base href for use with native history API
   */
  private getFullUrl(): string {
    const baseHref = this.locationStrategy ? this.locationStrategy.getBaseHref() : '/';
    const stackPath = this.getUrlFromStack();
    const base = baseHref.endsWith('/') ? baseHref : baseHref + '/';
    const path = stackPath.startsWith('/') ? stackPath.substring(1) : stackPath;
    return base + path;
  }

  /**
   * Pushes a new history entry with native API, bypassing Angular's router
   */
  private nativePushState(url: string): void {
    history.pushState({ stackNav: true, stackForward: true }, '', url);
  }

  /**
   * Replaces current history entry with native API, bypassing Angular's router
   */
  private nativeReplaceState(url: string): void {
    history.replaceState({ stackNav: true, stackForward: true }, '', url);
  }

  /**
   * Updates the browser URL based on the current stack.
   * Uses native history API to avoid Angular's router intercepting URL changes.
   */
  private updateUrl(): void {
    if (this.skipUrlUpdate || !this._managesUrl) {
      return;
    }

    const url = this.getFullUrl();
    console.log('[StackNavigationContext] updateUrl:', url, 'stack:', this.stack().map(p => p.key), 'managesUrl:', this._managesUrl);

    const currentPath = window.location.pathname;

    if (currentPath === url) {
      this.nativeReplaceState(url);
    } else {
      this.nativePushState(url);
    }
  }

  /**
   * Reconstructs navigation from a URL path by traversing the page tree.
   * @param urlPath - The URL path as a string (e.g., 'vehicles/edit/123') or array of segments
   * @param rootPage - The root page to start navigation from
   * @returns Object with success status, reconstructed path, and any holes (missing pages)
   */
  reconstructFromUrl(
    urlPath: string | string[],
    rootPage: StackPageInfo<unknown>
  ): NavigationReconstructionResult {
    // Parse URL into segments
    const segments = Array.isArray(urlPath)
      ? urlPath
      : urlPath.split('/').filter(s => s.length > 0);

    console.log('[StackNavigationContext] reconstructFromUrl:', { segments, rootPageKey: rootPage.key });

    if (segments.length === 0) {
      // Empty path - just navigate to root
      this.skipUrlUpdate = true;
      this.stack.set([rootPage]);
      this.skipUrlUpdate = false;
      console.log('[StackNavigationContext] Empty path, stack:', this.stack().map(p => p.key));
      return {
        success: true,
        reconstructedPath: [rootPage],
        holes: []
      };
    }

    // Start building the navigation path
    const reconstructedPath: StackPageInfo<unknown>[] = [rootPage];
    const holes: NavigationHole[] = [];
    let currentPage = rootPage;
    let currentDepth = 0;

    // Traverse segments, potentially consuming multiple segments per page
    let i = 0;
    while (i < segments.length) {
      currentDepth++;

      // Search for matching page in current page's children
      const match = this.findChildBySegments(currentPage, segments, i);

      if (!match) {
        // Hole detected - no matching child page found
        console.error('[StackNavigationContext] No match found for segment:', segments[i], 'at index', i, 'parent:', currentPage.key);
        holes.push({
          segment: segments[i],
          depth: currentDepth,
          parentKey: currentPage.key,
          availableKeys: this.getChildKeys(currentPage)
        });

        // Can't continue navigation - path is broken
        break;
      }

      console.log('[StackNavigationContext] Matched:', match.child.key, 'consumed:', match.consumed, 'segments');

      // Found matching page - add to path and advance
      reconstructedPath.push(match.child);
      currentPage = match.child;
      i += match.consumed;
    }

    // Determine if reconstruction was successful (all segments consumed, no holes)
    const success = holes.length === 0 && i >= segments.length;

    // Always apply the reconstructed path (even partial), so the stack is never left empty.
    // On full success this is the complete path; on partial failure it navigates as deep as possible.
    this.skipUrlUpdate = true;
    this.stack.set(reconstructedPath);
    this.skipUrlUpdate = false;

    return {
      success,
      reconstructedPath,
      holes,
      partialPath: reconstructedPath.slice(1).map(p => p.key).join('/')
    };
  }

  /**
   * Finds a child page by matching URL segments against child patterns.
   * Handles both static keys and pattern-based matching.
   * Returns the matched child and number of segments consumed.
   */
  private findChildBySegments(
    page: StackPageInfo<unknown>,
    segments: string[],
    startIndex: number
  ): { child: StackPageInfo<unknown>, consumed: number } | undefined {
    if (!page.childPages || page.childPages.length === 0) {
      return undefined;
    }

    const currentSegment = segments[startIndex];

    // Try to match segments against each child's pattern
    for (const child of page.childPages) {
      // If child has a pattern, try pattern matching first (takes precedence over key matching)
      if (child.pattern) {
        const match = this.matchPattern(child.pattern, segments, startIndex);
        if (match !== undefined) {
          // Pattern matched - use factory to create the page instance
          if (child.pageFactory) {
            const factoryResult = child.pageFactory(match.params);
            if (factoryResult) {
              // Merge outputs from child template with factory result
              // Factory result takes precedence, but child template provides defaults
              const mergedOutputs = {
                ...(child.outputs || {}),
                ...(factoryResult.outputs || {})
              };

              // Replace POP_NAVIGATION markers with actual pop handlers
              const boundOutputs: Record<string, (...args: any[]) => void> = {};
              for (const [key, handler] of Object.entries(mergedOutputs)) {
                const handlerValue = handler as any;
                if (handlerValue === POP_NAVIGATION || (typeof handlerValue === 'symbol' && handlerValue.toString() === 'Symbol(POP_NAVIGATION)')) {
                  boundOutputs[key] = () => this.pop();
                } else if (typeof handlerValue === 'function') {
                  boundOutputs[key] = handlerValue;
                }
              }

              return {
                child: {
                  ...factoryResult,
                  outputs: Object.keys(boundOutputs).length > 0 ? boundOutputs : undefined
                },
                consumed: match.consumed
              };
            }
            // Factory returned undefined, skip this child
            continue;
          }
          // If no factory, return the child template with matched params in data
          return {
            child: {
              ...child,
              key: this.buildKeyFromPattern(child.pattern, match.params),
              data: { ...child.data, ...match.params }
            },
            consumed: match.consumed
          };
        }
      } else if (child.key === currentSegment) {
        // Only use exact key match if there's no pattern (for static routes)
        return { child, consumed: 1 };
      }
    }

    return undefined;
  }

  /**
   * Builds a key from a pattern and extracted parameters.
   * E.g., pattern 'edit/:id' with params {id: '123'} becomes 'edit/123'
   * Preserves the hierarchical structure with slashes.
   */
  private buildKeyFromPattern(pattern: string, params: Record<string, string>): string {
    let key = pattern;
    for (const [paramName, paramValue] of Object.entries(params)) {
      key = key.replace(`:${paramName}`, paramValue);
    }
    return key;
  }

  /**
   * Matches URL segments against a pattern and extracts parameters.
   * Patterns are slash-separated and can span multiple URL segments.
   *
   * @param pattern - Pattern like 'edit/:id', 'new', or 'detail/:category/:item'
   * @param segments - Array of URL segments to match against
   * @param startIndex - Index in segments array to start matching from
   * @returns Object with extracted parameters and number of segments consumed, or undefined if no match
   *
   * @example
   * matchPattern('edit/:id', ['edit', '123'], 0) // { params: { id: '123' }, consumed: 2 }
   * matchPattern('new', ['new'], 0) // { params: {}, consumed: 1 }
   */
  private matchPattern(
    pattern: string,
    segments: string[],
    startIndex: number = 0
  ): { params: Record<string, string>, consumed: number } | undefined {
    const patternParts = pattern.split('/');

    // Check if we have enough segments
    if (startIndex + patternParts.length > segments.length) {
      return undefined;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const segmentPart = segments[startIndex + i];

      if (patternPart.startsWith(':')) {
        // Parameter placeholder - extract value
        const paramName = patternPart.substring(1);
        params[paramName] = segmentPart;
      } else if (patternPart !== segmentPart) {
        // Literal part doesn't match
        return undefined;
      }
    }

    return { params, consumed: patternParts.length };
  }



  /**
   * Gets all child page keys or patterns from a page
   */
  private getChildKeys(page: StackPageInfo<unknown>): string[] {
    if (!page.childPages || page.childPages.length === 0) {
      return [];
    }

    return page.childPages.map(child => child.pattern || child.key);
  }
}

/**
 * Result of URL navigation reconstruction
 */
export interface NavigationReconstructionResult {
  /** Whether the reconstruction was successful (no holes) */
  success: boolean;
  /** The reconstructed navigation path */
  reconstructedPath: StackPageInfo<unknown>[];
  /** Any holes (missing pages) found in the path */
  holes: NavigationHole[];
  /** The partial path that was successfully reconstructed */
  partialPath?: string;
}

/**
 * Represents a hole (missing page) in the navigation path
 */
export interface NavigationHole {
  /** The URL segment that couldn't be matched */
  segment: string;
  /** The depth in the navigation tree where the hole was found */
  depth: number;
  /** The key of the parent page where the search failed */
  parentKey: string;
  /** Available child page keys at this level */
  availableKeys: string[];
}

export interface StackPageInfo<T> {
  component: Type<unknown>;
  headerComponent?: Type<unknown>;
  data: any;
  key: string;
  title?: string;
  backStep?: number;
  /**
   * URL pattern for route matching (e.g., 'edit/:id', 'new', 'detail/:category/:item').
   * Used by navigation context to match URL segments and extract parameters.
   */
  pattern?: string;
  outputs?: Record<string, ((...args: any[]) => void) | symbol>;
  /**
   * Child pages that can be navigated to from this page.
   * Can be static or include patterns for dynamic matching.
   */
  childPages?: StackPageInfo<unknown>[];
  /**
   * Factory function to create page instances dynamically.
   * Called by navigation context when URL matches the pattern.
   * @param params - URL parameters extracted from the route (e.g., { id: '123' })
   * @returns A new StackPageInfo or undefined if page cannot be created
   */
  pageFactory?: (params: Record<string, string>) => StackPageInfo<unknown> | undefined;
}

/**
 * Describes a page route pattern with URL parameters.
 * Used for registering routes that need dynamic data.
 *
 * @example
 * {
 *   pattern: 'edit/:id',
 *   factory: (params) => VehicleUpdateForm.createPageInfo(
 *     Number(params.id),
 *     vehicleService.update,
 *     null, // DTO will be loaded by component
 *     () => navigationContext.pop()
 *   )
 * }
 */
export interface StackPageRoute {
  /** URL pattern with parameter placeholders (e.g., 'edit/:id', 'detail/:category/:item') */
  pattern: string;
  /** Factory function to create the page with resolved parameters */
  factory: (params: Record<string, string>) => StackPageInfo<unknown> | undefined;
}

@Component({
  imports: [],
  template: ''
})
class EmptyPagePlaceholder { }

export const EmptyPage: StackPageInfo<undefined> = {
  component: EmptyPagePlaceholder, data: undefined, key: ''
};
