import { RandomTripsCommandOptions } from "../types";
import { exec } from "child_process";
import * as utils from "../utils";

//TODO
export class RandomTripsHelper {

    private static routerSamplerString: string = '$SUMO_HOME/tools/randomTrips.py';

    public static async executeCommand(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            this.buildRandomTripsString();
            console.log(`RandomTrips command string: ${this.routerSamplerString}`);
            await exec(this.routerSamplerString, (error, stdout, stderr) => {
                resolve(stdout);
            });
        });
    }

    private static buildRandomTripsString() {
        this.routerSamplerString+=` -n ./assets/xml/osm.net_copy.xml -r ./assets/generated/${utils.getTimestamp()}/random_trips_output.xml --weights-prefix ./assets/xml/edges_weight`;
    }
}