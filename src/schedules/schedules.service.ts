import axios from "axios";
import { prisma } from "../services/prisma.service";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";
import { NotFoundError } from "@rgranatodutra/http-errors";
import { Schedule } from "@prisma/client";
import { ContactDetails, FETCH_CONTACT_DETAILS, FETCH_SECTOR_DETAILS, FETCH_USER_DETAILS, SectorDetails, UserDetails } from "./query/detailedQuery.select";
import Instances from "../services/instances.service";

class SchedulesService {
    private constructor() { }

    private static async findUniqueOrThrow(scheduleId: string) {
        const findSchedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });

        if (!findSchedule) {
            throw new NotFoundError("schedule not found");
        }

        return findSchedule;
    }

    public static async create(clientName: string, data: CreateScheduleDto) {
        const insertedSchedule = await prisma.schedule.create({ data: { clientName, ...data } });
        const url = `${process.env.WHATSAPP_SERVICE_URL}/api/${clientName}/custom-routes/finish-attendance`;

        await axios.post(url, {
            operatorId: data.toUserId,
            sectorId: data.sectorId,
            contactId: data.whatsappId,
        });

        return insertedSchedule;
    }

    public static async update(scheduleId: string, data: UpdateScheduleDto) {
        await SchedulesService.findUniqueOrThrow(scheduleId);
        const schedule = await prisma.schedule.update({ where: { id: scheduleId }, data });

        return schedule;
    }

    public static async delete(scheduleId: string) {
        await SchedulesService.findUniqueOrThrow(scheduleId);
        const schedule = await prisma.schedule.delete({ where: { id: scheduleId } });

        return schedule;
    }

    public static async findAllByClient(clientName: string) {
        const schedules = await prisma.schedule.findMany({
            where: { clientName, alreadyStarted: false },
            orderBy: { scheduleDate: "asc" }
        });
        const formatedSchedules = await SchedulesService.toInpulseFormat(clientName, schedules);

        return formatedSchedules;
    }

    public static async findAllByUser(clientName: string, userId: number) {
        const schedules = await prisma.schedule.findMany({
            where: { clientName, toUserId: userId, alreadyStarted: false },
            orderBy: { scheduleDate: "asc" }
        });
        const formatedSchedules = await SchedulesService.toInpulseFormat(clientName, schedules);

        return formatedSchedules;
    }

    private static async toInpulseFormat(clientName: string, schedules: Array<Schedule>) {
        const usersQuery = FETCH_USER_DETAILS + "\nWHERE CODIGO IN (?)";
        const userIds = Array.from(new Set([...schedules.map(s => s.toUserId), ...schedules.map(s => s.byUserId)]));
        const users = userIds.length ? await Instances.runQuery<UserDetails[]>(clientName, usersQuery, [userIds]) : [];

        const contactsQuery = FETCH_CONTACT_DETAILS + "\nWHERE ctt.CODIGO IN (?)";
        const contactIds = Array.from(new Set(schedules.map(s => s.whatsappId)));
        const contacts = contactIds.length ? await Instances.runQuery<ContactDetails[]>(clientName, contactsQuery, [contactIds]) : [];

        const sectorsQuery = FETCH_SECTOR_DETAILS + "\nWHERE CODIGO IN (?)";
        const sectorIds = Array.from(new Set(schedules.map(s => s.sectorId)));
        const sectors = sectorIds.length ? await Instances.runQuery<SectorDetails[]>(clientName, sectorsQuery, [sectorIds]) : [];

        const detailedSchedules = schedules.map(s => {
            const toUser = users.find(u => u.id === s.toUserId);
            const byUser = users.find(u => u.id === s.byUserId);
            const contact = contacts.find(c => c.id === s.whatsappId);
            const sector = sectors.find(sec => sec.id === s.sectorId);

            return { toUserName: toUser.userName, byUserName: byUser.userName, ...contact, ...sector, ...s }
        });

        return detailedSchedules;
    }
}

export default SchedulesService;