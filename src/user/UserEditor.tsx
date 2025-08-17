import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {Button, Divider, Form, Input, Select, Spin, Switch} from "antd";
import {SubmitResultHandler} from "../main";
import {AclEdit} from "../content";
import {userAPI} from "../services";
import {aclTool, type AclVO, ActionResult, type SubmitResult, type UserVO, validateParamId} from "@vempain/vempain-auth-frontend";

export function UserEditor() {
    const {paramId} = useParams();
    const [userId, setUserId] = useState<number>(0);

    const PRIVACY_TYPE: string[] = ["PRIVATE", "GROUP", "PUBLIC"];

    const [loading, setLoading] = useState<boolean>(false);
    const [userForm] = Form.useForm();
    const [acls, setAcls] = useState<AclVO[]>([]);
    const [user, setUser] = useState<UserVO | null>(null);
    const [submitResults, setSubmitResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ""});

    useEffect(() => {
        const emptyUser: UserVO = {
            id: 0,
            private_user: false,
            name: "",
            nick: "",
            login_name: "",
            privacy_type: "",
            email: "",
            street: "",
            pob: "",
            birthday: new Date(),
            description: "",
            password: "",
            acls: [],
            creator: 0,
            created: new Date(),
            modifier: 0,
            modified: new Date(),
            locked: false
        };

        setLoading(true);

        let tmpUserId: number = validateParamId(paramId);

        if (tmpUserId < 0) {
            setLoadResults({
                status: ActionResult.FAIL,
                message: "Called with invalid parameter"
            });
            return;
        }

        setUserId(tmpUserId);

        if (tmpUserId > 0) {
            userAPI.findById(tmpUserId, null)
                    .then((response) => {
                        setUser(response);
                        setAcls(response.acls);
                    })
                    .catch((error) => {
                        console.error("Error fetching:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to fetch the user, try again later"});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            setUser(emptyUser);
            setLoading(false);
        }

    }, [paramId]);

    function onFinish(values: UserVO): void {
        for (let i = 0; i < values.acls.length; i++) {
            values.acls[i] = aclTool.completeAcl(values.acls[i]);
        }

        setLoading(true);

        if (userId === 0) {
            userAPI.create(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: "User created successfully"});
                        setUser(response);
                    })
                    .catch((error) => {
                        console.error("Error creating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to create a new user"});
                    });
        } else {
            userAPI.update(values)
                    .then((response) => {
                        setSubmitResults({status: ActionResult.OK, message: "User updated successfully"});
                        setUser(response);
                    })
                    .catch((error) => {
                        console.error("Error updating:", error);
                        setSubmitResults({status: ActionResult.FAIL, message: "Failed to update user"});
                    });
        }

        setLoading(false);
        return;
    }

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={loadResults} successTo={"/units"} failTo={"/units"}/>);
    }

    if (submitResults.status !== ActionResult.NO_CHANGE) {
        return (<SubmitResultHandler submitResult={submitResults} successTo={"/users"} failTo={"/users"}/>);
    }

    return (
            <div className={"DarkDiv"}>
                <Spin tip={"Loading"} spinning={loading}>
                    {userId === 0 && <h1>Create new user</h1>}
                    {userId > 0 && <h1>Edit user {userId}</h1>}
                </Spin>
                {user !== null && <Form
                        form={userForm}
                        initialValues={user}
                        onFinish={onFinish}
                        labelCol={{span: 8}}
                        wrapperCol={{span: 18}}
                        style={{maxWidth: 1400}}
                        name={"PageForm"}
                        autoComplete={"off"}
                >
                    <Form.Item name={"id"} label={"ID"}>
                        <Input disabled={true}/>
                    </Form.Item>
                    <Form.Item name={"private_user"} label={"Is user private"} valuePropName={"checked"}>
                        <Switch/>
                    </Form.Item>
                    <Form.Item name={"name"} label={"User name"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"nick"} label={"Nick"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"login_name"} label={"Login name"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"privacy_type"} label={"Privacy type"}>
                        <Select>
                            {PRIVACY_TYPE.map((privacyType) => {
                                return (<Select.Option value={privacyType}>{privacyType}</Select.Option>);
                            })}
                        </Select>
                    </Form.Item>
                    <Form.Item
                            name={"email"}
                            label={"Email"}
                            rules={[
                                {
                                    type: "email",
                                    message: "The input is not valid E-mail!"
                                },
                                {
                                    required: true,
                                    message: "Please input your E-mail!"
                                },
                            ]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"street"} label={"Street"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"pob"} label={"Post office box"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"birthday"} label={"Birthday (YYYY-MM-DD"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"description"} label={"Description"}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name={"password"} label={"Password"}>
                        <Input/>
                    </Form.Item>

                    <Form.Item key={"user-acl-list"}
                               label={"Access control"}
                    >
                        <AclEdit acls={acls} parentForm={userForm}/>
                    </Form.Item>
                    <Form.Item wrapperCol={{offset: 8, span: 16,}}><Divider orientation={"left"}>Metadata</Divider></Form.Item>
                    <Form.Item name={"creator"} label={"Creator"}>
                        <Input disabled={true}/>
                    </Form.Item>

                    <Form.Item name={"created"} label={"Created"}>
                        <Input disabled={true}/>
                    </Form.Item>

                    <Form.Item name={"modifier"} label={"Modifier"}>
                        <Input disabled={true}/>
                    </Form.Item>

                    <Form.Item name={"modified"} label={"Modified"}>
                        <Input disabled={true}/>
                    </Form.Item>
                    <Form.Item wrapperCol={{offset: 8, span: 16,}} style={{textAlign: "center"}}>
                        <Button type={"primary"} htmlType={"submit"}>Save</Button>
                    </Form.Item>
                </Form>}
            </div>
    );
}
