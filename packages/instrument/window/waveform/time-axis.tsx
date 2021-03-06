import { observable } from "mobx";

import { IUnit, TIME_UNIT } from "eez-studio-shared/units";
import { IAxisModel, ZoomMode, ChartsController } from "eez-studio-ui/chart/chart";

interface IWaveform {
    samplingRate: number;
    length: number;
    xAxisDefaultSubdivisionOffset: number | undefined;
    xAxisDefaultSubdivisionScale: number | undefined;
}

////////////////////////////////////////////////////////////////////////////////

export class WaveformTimeAxisModel implements IAxisModel {
    constructor(private waveform: IWaveform) {}

    unit: IUnit = TIME_UNIT;

    chartsController: ChartsController;

    get minValue() {
        return 0;
    }

    get maxValue() {
        return (this.waveform.length - 1) / this.waveform.samplingRate;
    }

    get defaultFrom() {
        return 0;
    }

    get defaultTo() {
        return this.chartsController.chartWidth / this.waveform.samplingRate;
    }

    get minScale() {
        return (
            Math.min(
                this.waveform.samplingRate,
                this.chartsController.chartWidth /
                    ((this.waveform.length - 1) / this.waveform.samplingRate)
            ) / 2
        );
    }

    get maxScale() {
        return 10 * this.waveform.samplingRate;
    }

    @observable
    dynamic: {
        zoomMode: ZoomMode;
        from: number;
        to: number;
    } = {
        zoomMode: "default",
        from: 0,
        to: 0
    };

    @observable
    fixed: {
        zoomMode: ZoomMode;
        subdivisionOffset: number;
        subdivisonScale: number;
    } = {
        zoomMode: "default",
        subdivisionOffset: 0,
        subdivisonScale: 0
    };

    get defaultSubdivisionOffset() {
        return this.waveform.xAxisDefaultSubdivisionOffset;
    }

    get defaultSubdivisionScale() {
        return this.waveform.xAxisDefaultSubdivisionScale;
    }

    label: "";
    color: "";
    colorInverse: "";
}
