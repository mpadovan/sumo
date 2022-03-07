import { parse, ColumnOption } from "csv-parse/sync";
import { readFileSync } from "fs";
import moment, { Moment } from "moment-timezone";
import { 
    ManualData, 
    InductionLoopData, 
    MergedData,
    ProcessedMergedData
} from "./types";

export function mergeInputAndManualData(parsedManualData: ManualData[]) {
    return (record: InductionLoopData) => {
        // swapping dates (from european format dd/mm/yyyy to ISO format yyyy-mm-dd)
        const regex = new RegExp(/([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{1,4})/);
        const match = (<any>record.date).match(regex);
        record.date = moment(`${match[3]}-${match[2]}-${match[1]}`);
        // typing the data
        record.bus = parseInt(<any>record.bus);
        record.cars = parseInt(<any>record.cars);
        record.haulCars = parseInt(<any>record.haulCars);
        record.haulTruck = parseInt(<any>record.haulTruck);
        record.longTruck = parseInt(<any>record.longTruck);
        record.shortTruck = parseInt(<any>record.shortTruck);
        record.tractor = parseInt(<any>record.tractor);
        record.vans = parseInt(<any>record.vans);
        // merging
        for (const manualRecord of parsedManualData) {
            if (manualRecord.id == record.id) {
                record = <MergedData>{
                    ...record,
                    ...manualRecord
                };
                return record;
            }
        }

        // used to get only 52 rows (instead of 365)
        // use date() to get 12 (one for each month)
        // or dont use this if u want all the data (huge set, routeSampler can take along time to do it)
        if(record.date.date() == 1) {
            return record;
        } else {
            return undefined;
        }
    };
}

export function parseManualData(): ManualData[] {
    console.log("Loading info to be merge file...");
    const manualData: Buffer = readFileSync(`./assets/csv/info_to_merge.csv`);
    return parse(manualData, {
        columns: (record) => {
            return <ColumnOption[]>[
                "id",
                "street",
                "km",
                "town",
                "lat",
                "long",
                "lane_id",
                "position_in_lane",
                "avg_speed"
            ];
        }
    });
}

export function defineInductionLoopObject(): boolean | ColumnOption[] | ((record: any) => ColumnOption[]) | undefined {
    return (record) => {
        return <ColumnOption[]>[
            "id",
            "street",
            "km",
            "town",
            "date",
            "total",
            "motorbikes",
            "cars",
            "haulCars",
            "vans",
            "shortTruck",
            "longTruck",
            "haulTruck",
            "tractor",
            "bus"
        ];
    };
}

export const timestamp = new Date().valueOf();
export let maxTime: number = 0;
export let intervalTime: number = 0;
let isIntervalTimeSet = false;

export function getIntervalTime() {
    return intervalTime;
}
export function setIntervalTime(_intervalTime: number) {
    if(_intervalTime !== 0 && !isIntervalTimeSet) {
        intervalTime = _intervalTime;
        isIntervalTimeSet = true;
    }
}

export function getMaxTime() {
    return maxTime;
}
export function setMaxTime(_maxTime: number) {
    maxTime = _maxTime;
}

export function getTimestamp() {
    return timestamp;
}

export function defineMinutesIntervals(data: MergedData[]): ProcessedMergedData[] {
    console.log("Sorting and processind merged data");
    let splittedRecords: { [id: string] : MergedData[]; } = {};
    let processedData: ProcessedMergedData[] = [];
    let time: number = 0;
    for (const record of data) {
        splittedRecords[record.id] = (splittedRecords[record.id] || []).concat(record);
    }
    for (const key in splittedRecords) {
        if (Object.prototype.hasOwnProperty.call(splittedRecords, key)) {
            const element = splittedRecords[key];
            splittedRecords[key] = splittedRecords[key].sort((a, b) => (<Moment>a.date).unix() - (<Moment>b.date).unix());
            for (const record of splittedRecords[key]) {
                if(!isIntervalTimeSet) {
                    setIntervalTime(((record.date.valueOf()/1000) - (splittedRecords[key][0].date.valueOf()/1000))/60);
                }
                time = ((record.date.valueOf()/1000) - (splittedRecords[key][0].date.valueOf()/1000))/60;
                processedData.push({
                    ...record,
                    time
                });
            }
            if(getMaxTime() < time) {
                setMaxTime(time);
            }
        }
    }
    return processedData;
}