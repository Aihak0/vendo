import { MqttAuthGuard } from './mqtt-auth.guard';

describe('MqttAuthGuard', () => {
  it('should be defined', () => {
    expect(new MqttAuthGuard()).toBeDefined();
  });
});
