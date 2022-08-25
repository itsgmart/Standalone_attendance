import { TestBed } from '@angular/core/testing';

import { GlobalProviderService } from './global-provider.service';

describe('GlobalProviderService', () => {
  let service: GlobalProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
