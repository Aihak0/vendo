import { Test, TestingModule } from '@nestjs/testing';
import { MesinService } from './mesin.service';

describe('MesinService', () => {
  let service: MesinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MesinService],
    }).compile();

    service = module.get<MesinService>(MesinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
