import { Test, TestingModule } from '@nestjs/testing';
import { PergerakanStokService } from './pergerakan_stok.service';

describe('PergerakanStokService', () => {
  let service: PergerakanStokService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PergerakanStokService],
    }).compile();

    service = module.get<PergerakanStokService>(PergerakanStokService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
