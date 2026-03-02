import { Injectable, Provider } from '@angular/core';
import { ConfigurationProvider, CoreConfigurationProvider } from '@connected-ng/core';
import type { ConfigurationProviderProvider } from '@connected-ng/core';

import { DOCUMENT_SERVICE_CONFIG, DocumentServiceConfiguration } from '../ide/services/document-service';
import { PROJECT_SERVICE_CONFIG, ProjectServiceConfiguration } from '../ide/services/project-service';
import { SELECTION_SERVICE_CONFIG, SelectionServiceConfiguration } from '../ide/services/selection-service';
import { TOOLBOX_ITEM_SERVICE_CONFIG, ToolboxItemServiceConfiguration } from '../ide/services/toolbox-item-service';
import { EXPLORER_ITEM_SERVICE_CONFIG, ExplorerItemServiceConfiguration } from '../ide/services/explorer-item-service';

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
      ...CoreConfigurationProvider.getConfigurationTokenProviders()
    ];
  }
}
