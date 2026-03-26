import { Component, computed, inject, Injectable, InjectionToken, signal, Type } from '@angular/core';
import { Location } from '@angular/common';

export const STACK_PAGE = new InjectionToken<StackPageInfo<unknown>>('STACK_PAGE');
export const STACK_SHELL = new InjectionToken<any>('STACK_SHELL');
export const STACK_BASE_PATH = new InjectionToken<string>('STACK_BASE_PATH');

/**
 * Special marker for output handlers that should pop the navigation stack.
 * Use this in childPages definitions when you want formClose to automatically pop.
 */
export const POP_NAVIGATION = Symbol('POP_NAVIGATION');

@Injectable()
export class StackNavigationContext {
  private location = inject(Location, { optional: true });
  private basePath = inject(STACK_BASE_PATH, { optional: true }) ?? '';
  private _managesUrl = true;
  private rootPage?: StackPageInfo<unknown>;
  private locationSubscription?: any;

  stack = signal<StackPageInfo<unknown>[]>([]);
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
    this.rootPage = rootPage;

    if (!this.location || !this._managesUrl) {
      return;
    }

    // Subscribe to browser back/forward events (popstate)
    this.locationSubscription = this.location.subscribe((event) => {
      console.log('[StackNavigationContext] Browser navigation event (popstate):', event, 'current stack depth:', this.stack().length);

      // When browser back is pressed, the URL has already changed
      // We need to synchronize our stack by popping without updating the URL again
      if (this.stack().length > 1) {
        this.skipUrlUpdate = true;
        this.stack.update((stack) => stack.slice(0, -1));
        this.skipUrlUpdate = false;
        console.log('[StackNavigationContext] Popped stack due to browser back, new depth:', this.stack().length);
      }
    });
  }

  /**
   * Cleans up browser navigation subscription.
   */
  destroyBrowserNavigation() {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
      this.locationSubscription = undefined;
    }
  }

  push(...pages: StackPageInfo<unknown>[]) {
    this.stack.set([...this.stack(), ...pages]);
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
   * Generates a URL path from the current stack
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
   * Updates the browser URL based on the current stack
   */
  private updateUrl(): void {
    if (!this.location || this.skipUrlUpdate || !this._managesUrl) {
      return;
    }

    const url = this.getUrlFromStack();
    console.log('[StackNavigationContext] updateUrl:', url, 'stack:', this.stack().map(p => p.key), 'managesUrl:', this._managesUrl);
    this.location.go(url);
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

    if (success) {
      // Apply the reconstructed navigation stack (without triggering URL update)
      this.skipUrlUpdate = true;
      this.stack.set(reconstructedPath);
      this.skipUrlUpdate = false;
    }

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
