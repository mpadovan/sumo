import {parse} from "csv-parse/sync";
import { readFileSync, mkdir } from "fs";
import { 
    EdgeDataCreationOptions,
    ManualData,
    MergedData
} from "./types";
import { 
    defineInductionLoopObject,
    mergeInputAndManualData, 
    parseManualData,
    getTimestamp
} from "./utils";
import { EdgeDataHelper } from "./helper/edgeDataHelper";
import { RandomTripsHelper } from "./helper/randomTripsHelper";
import { RouteSamplerHelper } from "./helper/routeSamplerHelper";

(async () => {
    console.log("Loading data file...");
    const csvInput: Buffer = readFileSync(`./assets/csv/data2015.csv`);
    const parsedManualData: ManualData[] = parseManualData();
    console.log("Parsing and merging data...");
    const parsedInputData: MergedData[] = parse(csvInput, {
        columns: defineInductionLoopObject(),
        on_record: mergeInputAndManualData(parsedManualData)
    });
    let commandResult: string;
    mkdir(`./assets/generated/${getTimestamp()}`, () => {
        console.log(`Folder /assets/${getTimestamp()} created`);
    });

    /*
    Preparing edge data files
    */
    try {
        commandResult = await EdgeDataHelper.createEdgeData(<EdgeDataCreationOptions>{
            data: parsedInputData
        });
        await EdgeDataHelper.groupResults();
        console.log(`Edge data created. Output: ${commandResult}`);

    } catch (error) {
        console.log(error);
        throw new Error(<string>error);
    }

    /*
    Executing random trips
    */
    try {
        commandResult = await RandomTripsHelper.executeCommand();
        console.log(`Random trips executed. Output: ${commandResult}`);
    } catch (error) {
        console.log(error);
        throw new Error(<string>error);
    }

    /*
    Executing route sampler
    */
    try {
        commandResult = await RouteSamplerHelper.executeCommand();
        console.log(`Route sampler executed. Output: ${commandResult}`);
    } catch (error) {
        console.log(error);
        throw new Error(<string>error);
    }

    console.log(`Done, file in /assets/generated/${getTimestamp()}/route_sampler.xml`)

})()
