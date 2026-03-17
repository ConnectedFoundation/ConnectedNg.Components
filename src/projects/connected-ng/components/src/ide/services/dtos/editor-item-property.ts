import { EditorItem } from './editor-item';

/**
 * Represents a property for an editor item
 * DTOs matching Connected.Ide.Model.Properties backend
 */
export interface IEditorItemProperty {
  /** Full identifier string for the item this property belongs to */
  iEditorItem: string;
  /** Name of the property */
  name: string;
  /** Current value of the property */
  value?: string;
  /** Type name of the property (e.g., "System.String", "System.Int32") */
  propertyType: string;
  /** Editor type to use for displaying/editing this property (e.g., "string", "integer", "boolean", "dropdown") */
  editor?: string;
  /** Whether this property is read-only */
  isReadOnly: boolean;
}

/**
 * Query DTO for requesting editor item properties
 */
export interface IEditorItemPropertyQueryDto {
  iEditorItem: string;
  context?: string;
  editor?: string;
}

/**
 * Update DTO for updating a property value
 */
export interface IEditorItemPropertyUpdateDto {
  iEditorItem: string;
  name: string;
  value: string;
}
