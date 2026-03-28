import { Test, TestingModule } from '@nestjs/testing';
import { PergerakanStokController } from './pergerakan_stok.controller';

describe('PergerakanStokController', () => {
  let controller: PergerakanStokController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PergerakanStokController],
    }).compile();

    controller = module.get<PergerakanStokController>(PergerakanStokController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
