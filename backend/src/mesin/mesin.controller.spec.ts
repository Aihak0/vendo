import { Test, TestingModule } from '@nestjs/testing';
import { MesinController } from './mesin.controller';
import { beforeEach, describe, it } from 'node:test';

describe('MesinController', () => {
  let controller: MesinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MesinController],
    }).compile();

    controller = module.get<MesinController>(MesinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
