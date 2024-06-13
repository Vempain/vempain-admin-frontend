import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {validateParamId} from "../tools";
import {scheduleAPI} from "../services";

// Define the loading messages
const spinMessages: Record<string, string> = {
    loadingItemSchedule: "Loading item schedule...",
    triggerItemSchedule: "Triggering item schedule..."
};

function ItemPublishTrigger() {
    const {paramId} = useParams();
    const [itemId, setItemId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [spinTip, setSpinTip] = useState<string>(spinMessages.loadingItemSchedule);


    useEffect(() => {
        setSpinTip(spinMessages.loadingPageData);
        setLoading(true);
        let tmpPageId: number = validateParamId(paramId);

        if (tmpPageId > 0) {
            setItemId(tmpPageId);

            scheduleAPI.getFileImportSchedules()
        }

    }, []);
    return (
        <></>
    );
}

export {ItemPublishTrigger};