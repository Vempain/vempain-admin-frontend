import {CommonDataSetSelectorModal} from './CommonDataSetSelectorModal';

interface RichEmbedGpsTimeSeriesEditorProps {
    open: boolean;
    initialIdentifier?: string;
    onConfirm: (identifier: string) => void;
    onCancel: () => void;
}

export function RichEmbedGpsTimeSeriesEditor({
                                                 open,
                                                 initialIdentifier,
                                                 onConfirm,
                                                 onCancel,
                                             }: RichEmbedGpsTimeSeriesEditorProps) {
    return (
            <CommonDataSetSelectorModal
                    open={open}
                    title="Insert GPS Time Series Embed"
                    datasetType="time_series"
                    identifierPrefix="gps_timeseries_"
                    initialIdentifier={initialIdentifier}
                    searchPlaceholder="Search GPS time series data sets"
                    emptyText="No GPS time series data sets found"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
            />
    );
}

