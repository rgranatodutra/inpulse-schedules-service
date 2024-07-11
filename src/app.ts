import "express-async-errors";
import express from "express";
import cors from "cors";
import { handleRequestError } from "@rgranatodutra/http-errors";
import SchedulesController from "./schedules/schedules.controller";
import { getRouterEndpoints } from "inpulse-crm/utils";
import runSchedulesJob from "./schedules/schedules.job";

const app = express();

const controllers = {
    schedules: new SchedulesController()
}

app.use(express.json());
app.use(cors());

app.use(controllers.schedules.router);

Object.values(controllers).forEach(c => {
    const e = getRouterEndpoints(c.router, "");
    e.forEach(r => console.log(`[ROUTE] ${r}`));
});

app.use(handleRequestError);

runSchedulesJob();

export default app;