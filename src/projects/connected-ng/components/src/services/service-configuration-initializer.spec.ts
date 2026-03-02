import { TestBed } from '@angular/core/testing';
import { ComponentsConfigurationProvider } from './service-configuration-initializer';

describe('ComponentsConfigurationProvider', () => {
  let provider: ComponentsConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    provider = TestBed.inject(ComponentsConfigurationProvider);
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('should provide configuration tokens', () => {
    const tokens = ComponentsConfigurationProvider.getConfigurationTokens();
    expect(tokens).toBeDefined();
    expect(tokens.length).toBe(3);
  });

  it('should provide configuration providers', () => {
    const providers = ComponentsConfigurationProvider.getConfigurationTokenProviders();
    expect(providers).toBeDefined();
    expect(providers.length).toBe(3);
  });
});
