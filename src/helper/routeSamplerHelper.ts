import { exec } from "child_process";
import * as utils from "../utils";

export class RouteSamplerHelper {

    private static routerSamplerString: string = '$SUMO_HOME/tools/routeSampler.py';

    public static async executeCommand(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            await this.buildRouteSamplerString();
            console.log(`RouteSampler command string: ${this.routerSamplerString}`);
            await exec(this.routerSamplerString, (error, stdout, stderr) => {
                resolve(stdout);
            });
        });
    }

    private static buildRouteSamplerString() {
        this.routerSamplerString+=` -r ./assets/generated/${utils.getTimestamp()}/random_trips_output.xml --edgedata-files ./assets/generated/${utils.getTimestamp()}/edge_data.xml -o ./assets/generated/${utils.getTimestamp()}/route_sampler.xml`;
    }
}