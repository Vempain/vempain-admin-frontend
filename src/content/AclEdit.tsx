import React, { useEffect, useState } from "react";
import { Button, Col, Form, Row, Select, Switch } from "antd";
import { MinusCircleFilled, PlusCircleFilled } from "@ant-design/icons";
import { AclVO, UnitVO, UserVO } from "../models/Responses";
import { unitAPI, userAPI } from "../services";

interface AclEditProps {
    acls: AclVO[];
    onChange: (updatedAcls: AclVO[]) => void;
    parentForm: any;
}

export function AclEdit({acls, onChange, parentForm}: AclEditProps) {
    const [aclForm] = Form.useForm();
    const [userList, setUserList] = useState<UserVO[]>([]);
    const [unitList, setUnitList] = useState<UnitVO[]>([]);
    const [loadingLists, setLoadingLists] = useState<boolean>(true);

    useEffect(() => {
        Promise.all(
                [
                    userAPI.findAll(),
                    unitAPI.findAll(),
                ])
                .then((responses) => {
                    setUserList(responses[0]);
                    setUnitList(responses[1]);
                })
                .catch((error) => {
                    console.error("Failed to fetch users and units: ", error);
                })
                .finally(() => {
                    setLoadingLists(false);
                });
    }, []);

    function validateAclRow(rule: any, value: any, index: number): Promise<void> {
        const fieldName = rule.field.split(".")[2];

        if (fieldName === "user" || fieldName === "unit") {
            const userValue = parentForm.getFieldValue(["acls", index, "user"]);
            const unitValue = parentForm.getFieldValue(["acls", index, "unit"]);

            const userId: number | undefined = (userValue === undefined || userValue === null || userValue === "empty" || userValue === "") ? undefined : parseInt(userValue, 10);
            const unitId: number | undefined = (unitValue === undefined || unitValue === null || unitValue === "empty" || unitValue === "") ? undefined : parseInt(unitValue, 10);

            // One of the two must be selected
            if ((userId === undefined) && (unitId === undefined)) {
                return Promise.reject("Either User or Unit must be selected.");
            }

            // Both cannot be selected
            if ((userId !== undefined) && (unitId !== undefined)) {
                return Promise.reject("Either User or Unit must be selected, not both.");
            }
        }

        if (fieldName.endsWith("_privilege")) {
            const readPrivilegeValue = parentForm.getFieldValue(["acls", index, "read_privilege"]);
            const modifyPrivilegeValue = parentForm.getFieldValue(["acls", index, "modify_privilege"]);
            const deletePrivilegeValue = parentForm.getFieldValue(["acls", index, "delete_privilege"]);

            if (!readPrivilegeValue) {
                return Promise.reject("Read privilege must be selected.");
            }

            if ((fieldName === "delete_privilege" || fieldName === "modify_privilege")
                    && deletePrivilegeValue && !modifyPrivilegeValue) {
                return Promise.reject("Delete privilege requires modify privilege.");
            }
        }

        return Promise.resolve();
    }

    return (
            <>
                {!loadingLists && (
                        <>
                            <Row gutter={16} align="middle">
                                <Col span={4}><strong>User</strong></Col>
                                <Col span={4}><strong>Unit</strong></Col>
                                <Col span={3}><strong>Create</strong></Col>
                                <Col span={3}><strong>Read</strong></Col>
                                <Col span={3}><strong>Modify</strong></Col>
                                <Col span={3}><strong>Delete</strong></Col>
                            </Row>

                            <Form.List name={"acls"} key={"layout-acl-list"}>
                                {(acls, {add, remove}) => (
                                        <>
                                            {acls.map((field, index) => (
                                                    <Row gutter={16} align="middle" key={field.key}>
                                                        {/* User Dropdown */}
                                                        <Col span={4}>
                                                            <Form.Item name={[field.name, "permission_id"]} hidden={true}></Form.Item>
                                                            <Form.Item name={[field.name, "acl_id"]} hidden={true}></Form.Item>
                                                            <Form.Item name={[field.name, "user"]}
                                                                       rules={[
                                                                           {
                                                                               validator: (rule, value) => validateAclRow(rule, value, index)
                                                                           }
                                                                       ]}
                                                            >
                                                                <Select
                                                                        placeholder="Select User"
                                                                        showSearch
                                                                        optionFilterProp="children"
                                                                >
                                                                    {/* Empty item */}
                                                                    <Select.Option value={null} key="empty">
                                                                        None
                                                                    </Select.Option>
                                                                    {userList.map(user => (
                                                                            <Select.Option key={user.id} value={user.id}>
                                                                                {user.name} ({user.login_name})
                                                                            </Select.Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
                                                        </Col>

                                                        {/* Unit Dropdown */}
                                                        <Col span={4}>
                                                            <Form.Item name={[field.name, "unit"]}
                                                                       rules={[
                                                                           {
                                                                               validator: (rule, value) => validateAclRow(rule, value, index)
                                                                           }
                                                                       ]}
                                                            >
                                                                <Select placeholder="Select Unit" showSearch optionFilterProp="children">
                                                                    {/* Empty item */}
                                                                    <Select.Option key="empty">
                                                                        None
                                                                    </Select.Option>
                                                                    {unitList.map(unit => (
                                                                            <Select.Option key={unit.id} value={unit.id}>
                                                                                {unit.name}
                                                                            </Select.Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
                                                        </Col>

                                                        {/* Privileges Switches */}
                                                        {["create_privilege", "read_privilege", "modify_privilege", "delete_privilege"].map((privilege, privIndex) => (
                                                                <Col span={3} key={index + "-" + privIndex}>
                                                                    <Form.Item
                                                                            name={[field.name, privilege]}
                                                                            valuePropName="checked"
                                                                            rules={[
                                                                                {
                                                                                    validator: (rule, value) => validateAclRow(rule, value, index)
                                                                                }
                                                                            ]}
                                                                    >
                                                                        <Switch
                                                                                checkedChildren={true}
                                                                                unCheckedChildren={false}
                                                                                onChange={(checked) => {
                                                                                    aclForm.setFieldsValue({
                                                                                        [field.name]: {
                                                                                            [privilege]: checked
                                                                                        }
                                                                                    });
                                                                                }}
                                                                        />
                                                                    </Form.Item>
                                                                </Col>
                                                        ))}

                                                        {/* Remove Button */}
                                                        <Col span={2}>
                                                            <Button onClick={() => remove(field.name)}
                                                                    type="text"
                                                                    danger
                                                            ><MinusCircleFilled/></Button>
                                                        </Col>
                                                    </Row>
                                            ))}

                                            <Form.Item>
                                                <Button type="dashed" onClick={() => add()} block icon={<PlusCircleFilled/>}>
                                                    Add ACL
                                                </Button>
                                            </Form.Item>
                                        </>
                                )}
                            </Form.List>
                        </>
                )}
            </>
    );
}
