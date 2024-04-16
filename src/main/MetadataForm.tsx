import { Divider, Form, Input } from "antd";
import React from "react";

export function MetadataForm() {
    return <>
        <Divider orientation={"left"} key={"page-meta-divider"}>Metadata</Divider>
        <Form.Item
                name={"creator"}
                label={"Creator"}
                key={"page-creator"}>
            <Input type={"text"} disabled={true}/>
        </Form.Item>
        <Form.Item
                name={"created"}
                label={"Created At"}
                key={"page-createdAt"}>
            <Input type={"text"} disabled={true}/>
        </Form.Item>
        <Form.Item
                name={"modifier"}
                label={"Modifier"}
                key={"page-modifier"}>
            <Input type={"text"} disabled={true}/>
        </Form.Item>
        <Form.Item
                name={"modified"}
                label={"Modified At"}
                key={"page-modifiedAt"}>
            <Input type={"text"} disabled={true}/>
        </Form.Item>
        <Form.Item
                name={"locked"}
                label={"Locked"}
                key={"page-locked"}>
            <Input type={"text"} disabled={true}/>
        </Form.Item>
    </>;
}
