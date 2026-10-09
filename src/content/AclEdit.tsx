import {type FormInstance, Spin} from "antd";
import {useEffect, useState} from "react";
import {AclEditor, type AclVO, loadUsersAndUnits, type UnitVO, type UserVO} from "@vempain/vempain-auth-frontend";
import {unitAPI, userAPI} from "../services";

interface AclEditProps {
    acls: AclVO[];
    parentForm: FormInstance;
}

/**
 * The shared ACL editor of `@vempain/vempain-auth-frontend` fed with this backend's users and units. Every content editor (page, form,
 * layout, component, gallery) mounts it on its own form's `acls` list.
 */
export function AclEdit({acls, parentForm}: AclEditProps) {
    const [users, setUsers] = useState<UserVO[]>([]);
    const [units, setUnits] = useState<UnitVO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let active = true;
        loadUsersAndUnits(userAPI, unitAPI)
                .then(lookup => {
                    if (!active) return;
                    setUsers(lookup.users);
                    setUnits(lookup.units);
                })
                .catch(error => console.error("Failed to fetch users and units: ", error))
                .finally(() => {
                    if (active) setLoading(false);
                });
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return <Spin size="small"/>;
    }
    return <AclEditor acls={acls} parentForm={parentForm} users={users} units={units}/>;
}
