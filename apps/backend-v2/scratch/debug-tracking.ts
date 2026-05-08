import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrackingService } from './modules/tracking/tracking.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const trackingService = app.get(TrackingService);
  
  try {
    const data = await trackingService.getTrackingData(2, '2024-2025');
    console.log(`Grand Total:`, data.grandTotal);
    console.log(`Children:`, data.children.length);
    console.log(`Periods:`, data.periods.length);
    
    // Check first child with actions
    const activeChild = data.children.find(c => c.total > 0);
    console.log(`First active child:`, activeChild);
  } catch (e) {
    console.error(e);
  } finally {
    await app.close();
  }
}
bootstrap();
