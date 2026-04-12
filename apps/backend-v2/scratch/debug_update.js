
const { strict } = require('assert');

async function debugUpdate() {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('./dist/app.module.js');
  const { InstanceService } = require('./dist/modules/instance/instance.service.js');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const instanceService = app.get(InstanceService);
  
  try {
    console.log("Updating instance 1...");
    const res = await instanceService.update(1, {
      schoolName: "Test School",
      isOpen: true,
      gameStartDate: "2026-04-12",
      gamePeriodsCount: 24
    });
    console.log("SUCCESS:", res);
  } catch(e) {
    console.error("FAILED:");
    console.error(e);
  } finally {
    await app.close();
  }
}

debugUpdate();
