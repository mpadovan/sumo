import moment, { Moment } from "moment-timezone";

export interface InductionLoopData {
    id: string,
    street: string,
    km: string,
    town: string,
    date: Moment,
    total: number,
    motorbikes: number,
    cars: number,
    haulCars: number,
    vans:number,
    shortTruck: number,
    longTruck: number,
    haulTruck: number,
    tractor: number,
    bus: number,
}

export interface ManualData {
    id: string,
    street: string,
    km: string,
    town: string,
    lat: string,
    long: string,
    lane_id: string,
    position_in_lane: string,
    avg_speed: string,
}

export interface MergedData extends ManualData, InductionLoopData {}
export interface ProcessedMergedData extends MergedData {
    time: number
}

export interface EdgeDataOptions {
    detectorFilePath: string,
    flowFilePath: string,
    outputFilePath: string
}

export interface EdgeDataCreationOptions {
    data: MergedData[]
}

export interface RouteSamplerCommandOptions {
    routeFilePath: string,
    edgeDataFilePath: string,
    outputFilePath: string
}

export interface RandomTripsCommandOptions {
    routeFilePath: string,
    weightsPrefixPath: string,
    outputFilePath: string
}