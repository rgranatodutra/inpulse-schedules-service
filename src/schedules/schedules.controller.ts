import { Request, Response, Router } from "express";
import { validateDto } from "inpulse-crm/utils";
import "dotenv/config";
import SchedulesService from "./schedules.service";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";

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
        const schedule = SchedulesService.create(clientName, req.body);

        return res.status(201).json({ message: "successful inserted schedule", data: schedule });
    }

    private async update(req: Request, res: Response) {
        const { scheduleId } = req.params;
        const schedule = SchedulesService.update(scheduleId, req.body);

        return res.status(200).json({ message: "successful updated schedule", data: schedule });
    }

    private async remove(req: Request, res: Response) {
        const { scheduleId } = req.params;
        const schedule = await SchedulesService.delete(scheduleId);

        return res.status(200).json({ message: "successful removed schedule", data: schedule });
    }

    private async findAllByClient(req: Request, res: Response) {
        const { clientName } = req.params;
        const schedules = await SchedulesService.findAllByClient(clientName);

        return res.status(200).json({ message: "successful fetched client schedules", data: schedules });
    }

    private async findAllByUser(req: Request, res: Response) {
        const { clientName, toUserId } = req.params;
        const schedules = await SchedulesService.findAllByUser(clientName, +toUserId);

        return res.status(200).json({ message: "successful fetched user schedules", data: schedules });
    }
}

export default SchedulesController;