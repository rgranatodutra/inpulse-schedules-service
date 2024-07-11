import cron from 'node-cron';
import { prisma } from "../services/prisma.service";
import axios from 'axios';

async function checkSchedules() {
    const currentDate = new Date();

    const schedules = await prisma.schedule.findMany({
        where: {
            scheduleDate: { lte: currentDate },
            alreadyStarted: false
        }
    });

    await Promise.all(schedules.map(async schedule => {
        console.log(new Date().toLocaleString(), `Schedule for ${schedule.clientName}: `, schedule.id, schedule.scheduleDate);

        const url = `http://localhost:8000/api/${schedule.clientName}/custom-routes/start-attendance`;

        const attendanceData = {
            operatorId: schedule.toUserId,
            contactId: schedule.whatsappId,
            sectorId: schedule.sectorId,
        }

        await axios.post(url, attendanceData);
        await prisma.schedule.update({ where: { id: schedule.id }, data: { startedAt: new Date(), alreadyStarted: true } });
    }));
}

const runSchedulesJob = () => cron.schedule('*/1 * * * *', checkSchedules);

export default runSchedulesJob;