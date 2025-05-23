import { Test, TestingModule } from '@nestjs/testing';
import { SavesController } from './saves.controller';

describe('SavesController', () => {
  let controller: SavesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavesController],
    }).compile();

    controller = module.get<SavesController>(SavesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
