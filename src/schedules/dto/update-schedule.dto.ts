import { IsBoolean, IsDateString, IsOptional } from "class-validator";
import { Schedule } from "../types/schedule.type";

export class UpdateScheduleDto implements Partial<Schedule> {
    @IsDateString()
    @IsOptional()
    scheduleDate: Date;

    @IsDateString()
    @IsOptional()
    startedAt?: Date;

    @IsBoolean()
    @IsOptional()
    alreadyStarted?: boolean;
}