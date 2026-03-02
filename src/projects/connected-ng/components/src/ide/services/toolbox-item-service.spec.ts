import { TestBed } from '@angular/core/testing';
import { IdeToolboxItemService, TOOLBOX_ITEM_SERVICE_CONFIG, ToolboxItemServiceConfiguration } from './toolbox-item-service';

describe('IdeToolboxItemService', () => {
    let service: IdeToolboxItemService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: TOOLBOX_ITEM_SERVICE_CONFIG,
                    useValue: new ToolboxItemServiceConfiguration()
                }
            ]
        });
        service = TestBed.inject(IdeToolboxItemService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
