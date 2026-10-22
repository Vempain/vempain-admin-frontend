import {Space, Switch, Typography} from "antd";

interface Props {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

/**
 * The "modified after publish" filter of the lists of resources released to the website: on, only the resources whose
 * website copy is outdated (released once and modified after that release) are listed.
 */
export function ReleaseFilterSwitch({checked, onChange}: Props) {
    return (
            <Space size={8}>
                <Switch checked={checked}
                        onChange={onChange}
                        aria-label="Only modified after publish"/>
                <Typography.Text>Only modified after publish</Typography.Text>
            </Space>
    );
}
