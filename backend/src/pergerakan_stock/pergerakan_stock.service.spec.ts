import { Test, TestingModule } from '@nestjs/testing';
import { PergerakanStockService } from './pergerakan_stock.service';

describe('PergerakanStockService', () => {
  let service: PergerakanStockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PergerakanStockService],
    }).compile();

    service = module.get<PergerakanStockService>(PergerakanStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
