/**
 * Represents an item returned by the property value collection service.
 * Matches IPropertyValueCollectionItem from Connected.Ide.Model.
 */
export interface IPropertyValueCollectionItem {
  id: string;
  type: string;
  /** Display label for the option. */
  value: string;
  /** The value written back to the property on selection. */
  key: string;
}

/**
 * Query DTO for IPropertyValueCollectionService.
 * Matches IQueryPropertyValueCollectionItemsDto from Connected.Ide.Model.
 */
export interface IPropertyValueCollectionQueryDto {
  /** Full property type string, e.g. `collection:workflow-device?type=opcua`. */
  type: string;
}
