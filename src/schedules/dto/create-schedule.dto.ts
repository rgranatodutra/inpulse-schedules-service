import { IsDateString, IsInt, IsString } from "class-validator";
import { Schedule } from "../types/schedule.type";

export class CreateScheduleDto implements Partial<Schedule> {
    @IsDateString()
    scheduleDate: Date;

    @IsInt()
    whatsappId: number;

    @IsInt()
    toUserId: number;

    @IsInt()
    byUserId: number;

    @IsInt()
    sectorId: number;
}