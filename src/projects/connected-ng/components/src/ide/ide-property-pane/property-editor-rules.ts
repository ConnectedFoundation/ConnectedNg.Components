import { InjectionToken } from '@angular/core';

export type PropertyEditorType = 'text' | 'number' | 'checkbox' | 'dropdown' | 'json';

/**
 * A rule that maps property data to an editor type and optional display label.
 * Rules are evaluated in registration order; the first match wins.
 * A rule matches when ALL specified criteria satisfy the property.
 */
export interface PropertyEditorRule {
  /** Exact property name to match (case-sensitive). */
  name?: string;
  /**
   * Full CLR type name to match (e.g. 'System.Boolean', 'System.Int32').
   * Matched against IEditorItemProperty.propertyType.
   */
  propertyType?: string;
  /** The editor control to render for matched properties. */
  editor: PropertyEditorType;
  /** Localized display label. When omitted the raw property name is shown. */
  label?: string;
}

/**
 * Multi-provider token for registering PropertyEditorRule arrays.
 * Provide with `{ provide: PROPERTY_EDITOR_RULES, useValue: [...], multi: true }`.
 */
export const PROPERTY_EDITOR_RULES = new InjectionToken<PropertyEditorRule[][]>('PROPERTY_EDITOR_RULES');
