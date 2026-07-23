import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionLogsController } from './session-logs.controller';
import { SessionLogsService } from './session-logs.service';
import { SessionLog } from './session-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SessionLog])],
  controllers: [SessionLogsController],
  providers: [SessionLogsService],
  exports: [SessionLogsService],
})
export class SessionLogsModule {}
