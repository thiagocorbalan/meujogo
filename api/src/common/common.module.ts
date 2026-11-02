import { Global, Module } from '@nestjs/common';
import { CryptoService } from './services/crypto.service.js';

@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CommonModule {}
