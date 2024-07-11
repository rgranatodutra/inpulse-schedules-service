import { InstancesMannager } from "inpulse-crm/connection";
import "dotenv/config";

class Instances {
    private static mannager = new InstancesMannager(process.env.INSTANCES_SERVICE_URL);

    public static async runQuery<T>(clientName: string, query: string, values: Array<any>) {
        const response = await this.mannager.executeQuery<T>(clientName, query, values)

        return response.result;
    }
}

export default Instances;