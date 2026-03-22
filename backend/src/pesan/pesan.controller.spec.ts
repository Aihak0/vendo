import { Test, TestingModule } from '@nestjs/testing';
import { PesanController } from './pesan.controller';

describe('PesanController', () => {
  let controller: PesanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PesanController],
    }).compile();

    controller = module.get<PesanController>(PesanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
