import { TestBed } from '@angular/core/testing';
import { IdeExplorerItemService, EXPLORER_ITEM_SERVICE_CONFIG, ExplorerItemServiceConfiguration } from './explorer-item-service';

describe('IdeExplorerItemService', () => {
    let service: IdeExplorerItemService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: EXPLORER_ITEM_SERVICE_CONFIG,
                    useValue: new ExplorerItemServiceConfiguration()
                }
            ]
        });
        service = TestBed.inject(IdeExplorerItemService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
