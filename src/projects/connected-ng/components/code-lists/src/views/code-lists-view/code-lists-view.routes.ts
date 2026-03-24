import { Route, Routes } from '@angular/router';
import { CodeListsView } from './code-lists-view';

/**
 * Creates Angular Router routes for code lists view.
 * This route configuration captures all code-list related URLs and delegates
 * navigation to the StackNavigationContext, which handles pattern matching
 * and component creation based on registered childPages.
 * 
 * @param basePath - Base path where code lists will be mounted (e.g., 'management/code-lists')
 * @returns Route configuration with wildcard matching for all code list subroutes
 * 
 * @example
 * // In app.routes.ts
 * import { createCodeListsRoute } from '@connected-ng/components';
 * 
 * export const routes: Routes = [
 *   createCodeListsRoute('management/code-lists'),
 *   // other routes...
 * ];
 * 
 * // This will match:
 * // - /management/code-lists
 * // - /management/code-lists/vehicles
 * // - /management/code-lists/vehicles/new
 * // - /management/code-lists/vehicles/edit-123
 */
export function createCodeListsRoute(basePath: string): Route {
  return {
    path: basePath,
    children: [
      {
        path: '',
        component: CodeListsView,
      },
      {
        path: '**',
        component: CodeListsView,
      }
    ]
  };
}

/**
 * Pre-configured routes for code lists at 'management/code-lists'.
 * Use this if you want the standard configuration without customization.
 * 
 * @example
 * // In app.routes.ts
 * import { codeListsRoutes } from '@connected-ng/components';
 * 
 * export const routes: Routes = [
 *   ...codeListsRoutes,
 *   // other routes...
 * ];
 */
export const codeListsRoutes: Routes = [
  createCodeListsRoute('management/code-lists')
];
