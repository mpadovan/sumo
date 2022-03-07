import { exec } from "child_process";
import { EdgeDataCreationOptions, ProcessedMergedData } from "../types";
import { stringify } from "csv-stringify";
import { writeFileSync, readFileSync } from "fs";
import * as utils from '../utils'
import * as xml2js from "xml2js";

export class EdgeDataHelper {

    private static edgeDataString: string = `$SUMO_HOME/tools/detector/edgeDataFromFlow.py`;
    private static detectorSpeedMap: {[id: string]: string;} = {};
    private static sumoDetectorSpeedMap: {[id: string]: string;} = {};
    private static parser = new xml2js.Parser();
    private static builder = new xml2js.Builder();

    public static async createEdgeData(options: EdgeDataCreationOptions): Promise<string> {
        const withMinutesFromStartData = utils.defineMinutesIntervals(options.data);
        await this.buildFlowCSVFile(withMinutesFromStartData);
        return new Promise(async (resolve, reject) => {
            console.log(`EdgeData command string: ${this.edgeDataString}`);
            await exec(this.edgeDataString, (error, stdout, stderr) => {
                resolve(stdout);
            });
        });
    }

    private static buildEdgeDataString() {
        this.edgeDataString+=` -d ./assets/xml/detector_file.xml -f ./assets/generated/${utils.getTimestamp()}/flow_file.csv -i ${utils.getIntervalTime()} -e ${utils.getMaxTime()} -o ./assets/generated/${utils.getTimestamp()}/edge_data.xml`;
    }

    public static async buildFlowCSVFile(data: ProcessedMergedData[]) {
        console.log("Writing flow data...");
        let flowData: any[] = [];
        flowData = data.map((row) => {
            this.detectorSpeedMap[row.id] = row.avg_speed;
            return {
                "Detector": row.id,
                "Time": row.time,
                "qPKW": row.haulCars+row.cars+row.vans, // groupping < 2.5 tonns vehicles
                "qLKW": row.haulTruck+row.bus+row.shortTruck+row.longTruck, // groupping > 2.5 tonns vehicles
                "vPKW": row.avg_speed,
                "vLKW": row.avg_speed,
            };
        });
        return new Promise((resolve, reject) => {
            
            stringify(flowData, {
                header: true,
                delimiter: ';',
            }, (err, output) => {
                if(err) reject(err);
                const path = `./assets/generated/${utils.getTimestamp()}/flow_file.csv`;
                writeFileSync(path, output);
                this.buildEdgeDataString();
                resolve(path);
            })
        })
    }

    public static async groupResults(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const xmlData = readFileSync(`./assets/generated/${utils.getTimestamp()}/edge_data.xml`);
            await this.buildSpeedDictionary();
            this.parser.parseString(xmlData, (err: any, result: any) => {
                for (const interval of result.data.interval) {
                    for (let edge of interval.edge) {
                        edge.$.entered = parseInt(edge.$.qLKW) + parseInt(edge.$.qPKW);
                        edge.$.speed = this.sumoDetectorSpeedMap[edge.$.id];
                    }
                }
                const buildedXML = this.builder.buildObject(result);
                writeFileSync(`./assets/generated/${utils.getTimestamp()}/edge_data.xml`, buildedXML);
                resolve();
            });
        });
    }

    private static async buildSpeedDictionary(): Promise<void> {
        const detectorFile = readFileSync('./assets/xml/detector_file.xml');
        return new Promise((resolve, reject) => {
            this.parser.parseString(detectorFile, (err: any, result: any) => {
                for (const detector of result.detectors.detectorDefinition) {
                    this.sumoDetectorSpeedMap[(<string>detector.$.lane).replace(/\_.*/, "")] = this.detectorSpeedMap[detector.$.id];
                }
                resolve();
            })
        })
    }
}