export interface Schedule {
    id: string;
    clientName: string;
    scheduleDate: Date;
    scheduledAt: Date;
    startedAt: Date | null;
    alreadyStarted: boolean;
    whatsappId: number;
    customerId: number;
    toUserId: number;
    byUserId: number;
    sectorId: number;
}