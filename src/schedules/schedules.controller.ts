import { Request, Response, Router } from "express";
import { prisma } from "../services/prisma.service";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";
import { NotFoundError } from "@rgranatodutra/http-errors";
import { validateDto } from "inpulse-crm/utils";
import Instances from "../services/instances.service";
import { ContactDetails, FETCH_CONTACT_DETAILS, FETCH_SECTOR_DETAILS, FETCH_USER_DETAILS, SectorDetails, UserDetails } from "./query/detailedQuery.select";
import axios from "axios";

class SchedulesController {
    public readonly router: Router;

    constructor() {
        this.router = Router();

        this.router.get("/api/wa-schedules/:clientName", this.findAllByClient);
        this.router.get("/api/wa-schedules/:clientName/:toUserId", this.findAllByUser);
        this.router.post("/api/wa-schedules/:clientName", validateDto(CreateScheduleDto), this.create);
        this.router.patch("/api/wa-schedules/:clientName/:scheduleId", validateDto(UpdateScheduleDto), this.update);
        this.router.delete("/api/wa-schedules/:clientName/:scheduleId", this.remove);
    }

    private async create(req: Request, res: Response) {
        const clientName = req.params.clientName;
        const body: CreateScheduleDto = req.body;

        const insertedSchedule = await prisma.schedule.create({ data: { clientName, ...body } });

        const url = `${process.env.WHATSAPP_SERVICE_URL}/api/${clientName}/custom-routes/finish-attendance`;
        await axios.post(url, {
            operatorId: body.toUserId,
            sectorId: body.sectorId,
            contactId: body.whatsappId,
        });

        return res.status(201).json({ message: "successful inserted schedule", data: insertedSchedule });
    }

    private async update(req: Request, res: Response) {
        const { clientName, scheduleId } = req.params;
        const body: UpdateScheduleDto = req.body;

        const findSchedule = await prisma.schedule.findUnique({ where: { id: scheduleId, clientName } });
        if (!findSchedule) {
            throw new NotFoundError("schedule not found");
        }

        const updatedSchedule = await prisma.schedule.update({ where: { id: scheduleId, clientName }, data: body });
        return res.status(200).json({ message: "successful updated schedule", data: updatedSchedule });
    }

    private async remove(req: Request, res: Response) {
        const { clientName, scheduleId } = req.params;

        const findSchedule = await prisma.schedule.findUnique({ where: { id: scheduleId, clientName } });
        if (!findSchedule) {
            throw new NotFoundError("schedule not found");
        }

        const removedSchedule = await prisma.schedule.delete({ where: { id: scheduleId, clientName } });
        return res.status(200).json({ message: "successful removed schedule", data: removedSchedule });
    }

    private async findAllByClient(req: Request, res: Response) {
        const { clientName } = req.params;

        const schedules = await prisma.schedule.findMany({
            where: { clientName, alreadyStarted: false },
            orderBy: { scheduleDate: "asc" }
        });

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

        return res.status(200).json({ message: "successful fetched client schedules", data: detailedSchedules });
    }

    private async findAllByUser(req: Request, res: Response) {
        try {
            const { clientName, toUserId } = req.params;

            const schedules = await prisma.schedule.findMany({
                where: { clientName, toUserId: +toUserId, alreadyStarted: false },
                orderBy: { scheduleDate: "asc" }
            });

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


            return res.status(200).json({ message: "successful fetched user schedules", data: detailedSchedules });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: "unknown server error", err });
        }
    }
}

export default SchedulesController;