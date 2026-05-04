import { Injectable, Provider } from '@angular/core';
import { ConfigurationProvider, CoreConfigurationProvider } from '@connected-ng/core';
import type { ConfigurationProviderProvider } from '@connected-ng/core';

import { DOCUMENT_SERVICE_CONFIG, DocumentServiceConfiguration } from '../ide/services/document-service';
import { PROJECT_SERVICE_CONFIG, ProjectServiceConfiguration } from '../ide/services/project-service';
import { SELECTION_SERVICE_CONFIG, SelectionServiceConfiguration } from '../ide/services/selection-service';
import { TOOLBOX_ITEM_SERVICE_CONFIG, ToolboxItemServiceConfiguration } from '../ide/services/toolbox-item-service';
import { EXPLORER_ITEM_SERVICE_CONFIG, ExplorerItemServiceConfiguration } from '../ide/services/explorer-item-service';
import { EDITOR_PROPERTY_SERVICE_CONFIG, EditorPropertyServiceConfiguration } from '../ide/services/editor-property-service';
import { PROPERTY_COLLECTION_SERVICE_CONFIG, PropertyCollectionServiceConfiguration } from '../ide/services/property-collection-service';
import { ISSUE_SERVICE_CONFIG, IssueServiceConfiguration } from '../ide/services/issue-service';
import { EDITOR_ITEM_SERVICE_CONFIG, EditorItemServiceConfiguration } from '../ide/services/editor-item-service';

@Injectable({
  providedIn: 'root',
})
export class ComponentsConfigurationProvider extends ConfigurationProvider {
  override get configurationProviders(): Provider[] {
    return ComponentsConfigurationProvider.getConfigurationTokenProviders();
  }

  override get configurationTokens() {
    return ComponentsConfigurationProvider.getConfigurationTokens();
  }

  static getConfigurationTokens(): any[] {
    return [
      DOCUMENT_SERVICE_CONFIG,
      PROJECT_SERVICE_CONFIG,
      SELECTION_SERVICE_CONFIG,
      TOOLBOX_ITEM_SERVICE_CONFIG,
      EXPLORER_ITEM_SERVICE_CONFIG,
      EDITOR_PROPERTY_SERVICE_CONFIG,
      PROPERTY_COLLECTION_SERVICE_CONFIG,
      ISSUE_SERVICE_CONFIG,
      EDITOR_ITEM_SERVICE_CONFIG,
      ...CoreConfigurationProvider.getConfigurationTokens()
    ];
  }

  static getConfigurationTokenProviders(): Provider[] {
    return [
      { provide: DOCUMENT_SERVICE_CONFIG, useValue: new DocumentServiceConfiguration() },
      { provide: PROJECT_SERVICE_CONFIG, useValue: new ProjectServiceConfiguration() },
      { provide: SELECTION_SERVICE_CONFIG, useValue: new SelectionServiceConfiguration() },
      { provide: EXPLORER_ITEM_SERVICE_CONFIG, useValue: new ExplorerItemServiceConfiguration() },
      { provide: TOOLBOX_ITEM_SERVICE_CONFIG, useValue: new ToolboxItemServiceConfiguration() },
      { provide: EDITOR_PROPERTY_SERVICE_CONFIG, useValue: new EditorPropertyServiceConfiguration() },
      { provide: PROPERTY_COLLECTION_SERVICE_CONFIG, useValue: new PropertyCollectionServiceConfiguration() },
      { provide: ISSUE_SERVICE_CONFIG, useValue: new IssueServiceConfiguration() },
      { provide: EDITOR_ITEM_SERVICE_CONFIG, useValue: new EditorItemServiceConfiguration() },
      ...CoreConfigurationProvider.getConfigurationTokenProviders()
    ];
  }
}
