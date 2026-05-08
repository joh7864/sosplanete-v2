import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EcoBarRaceService } from './modules/stimulation/eco-bar-race.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(EcoBarRaceService);
  
  try {
    console.log("Recalcul Eco-Bar-Race pour 2024-2025...");
    await service.recalculateAllHistory('2024-2025');
    console.log("Fini !");
  } catch (e) {
    console.error(e);
  } finally {
    await app.close();
  }
}
bootstrap();
