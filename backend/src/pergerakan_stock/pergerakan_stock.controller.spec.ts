import { Test, TestingModule } from '@nestjs/testing';
import { PergerakanStockController } from './pergerakan_stock.controller';

describe('PergerakanStockController', () => {
  let controller: PergerakanStockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PergerakanStockController],
    }).compile();

    controller = module.get<PergerakanStockController>(PergerakanStockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
