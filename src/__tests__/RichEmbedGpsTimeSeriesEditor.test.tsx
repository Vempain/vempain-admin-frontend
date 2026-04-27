import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RichEmbedGpsTimeSeriesEditor} from '../content/embeds/RichEmbedGpsTimeSeriesEditor';
import type {DataSummaryResponse} from '../models';

jest.mock('antd', () => {
    const ReactModule = require('react');

    const Option = () => null;

    const Select = ({children, onChange, onSearch, searchValue, value, placeholder}: any) => {
        const options = ReactModule.Children.toArray(children).map((child: any) => ({
            value: child.props.value,
            label: child.props.label ?? child.props.value,
        }));

        return (
                <div>
                    <input
                            aria-label="dataset-search"
                            placeholder={placeholder}
                            value={searchValue ?? ''}
                            onChange={(event) => onSearch?.(event.target.value)}
                    />
                    <select
                            aria-label="dataset-select"
                            value={value ?? ''}
                            onChange={(event) => onChange?.(event.target.value || undefined)}
                    >
                        <option value="">--</option>
                        {options.map((option: { value: string; label: string }) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
        );
    };

    Select.Option = Option;

    return {
        Alert: ({message}: { message: string }) => <div>{message}</div>,
        Modal: ({title, open, onOk, onCancel, children}: any) => open ? (
                <div>
                    <h1>{title}</h1>
                    {children}
                    <button onClick={onOk}>OK</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
        ) : null,
        Select,
        Spin: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
    };
});

const getAllDataSets = jest.fn();

jest.mock('../services', () => ({
    dataAPI: {
        getAllDataSets: (...args: unknown[]) => getAllDataSets(...args),
    }
}));

const buildDataSummary = (overrides: Partial<DataSummaryResponse>): DataSummaryResponse => ({
    id: 1,
    identifier: 'default_dataset',
    type: 'time_series',
    description: 'GPS data set',
    column_definitions: '[]',
    create_sql: 'CREATE TABLE any_name (timestamp TIMESTAMP)',
    fetch_all_sql: 'SELECT * FROM any_name',
    fetch_subset_sql: 'SELECT * FROM any_name WHERE timestamp >= :from',
    generated: '2026-01-01T10:00:00Z',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
    ...overrides,
});

describe('RichEmbedGpsTimeSeriesEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads GPS time-series datasets on open and confirms the selected identifier', async () => {
        getAllDataSets.mockResolvedValue([
            buildDataSummary({id: 10, identifier: 'matkailu_etiopia_2016', description: 'GPS time-series for Ethiopia'}),
            buildDataSummary({id: 11, identifier: 'gps_timeseries_legacy_track', description: 'GPS legacy route'}),
        ]);

        const onConfirm = jest.fn();
        const onCancel = jest.fn();
        const user = userEvent.setup();

        render(
                <RichEmbedGpsTimeSeriesEditor
                        open={true}
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                />
        );

        await waitFor(() => {
            expect(getAllDataSets).toHaveBeenCalledWith({
                type: 'time_series',
                identifier_prefix: undefined,
                search: 'gps',
            });
        });

        const searchInput = screen.getByLabelText('dataset-search');
        expect(screen.getByRole('option', {name: 'matkailu_etiopia_2016'})).not.toBeNull();
        expect(screen.getByRole('option', {name: 'gps_timeseries_legacy_track'})).not.toBeNull();

        await user.type(searchInput, 'legacy');

        await waitFor(() => {
            expect(screen.queryByRole('option', {name: 'matkailu_etiopia_2016'})).toBeNull();
        });
        expect(screen.getByRole('option', {name: 'gps_timeseries_legacy_track'})).not.toBeNull();

        await user.selectOptions(screen.getByLabelText('dataset-select'), 'gps_timeseries_legacy_track');
        await user.click(screen.getByRole('button', {name: 'OK'}));

        expect(onConfirm).toHaveBeenCalledWith('gps_timeseries_legacy_track');
        expect(onCancel).not.toHaveBeenCalled();
    });
});





