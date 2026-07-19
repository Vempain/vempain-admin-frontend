import {ContentTypeEnum, PublishStatusEnum} from "../models";
import {Tag} from "antd";
import type {JSX} from "react";
import type {PresetColorType} from "antd/es/_util/colors";

function contentTypeEnumToTag(contentTypeEnum: ContentTypeEnum, recordId: number): JSX.Element {
    let color: PresetColorType;
    let tagLabel: string;

    switch (contentTypeEnum) {
        case ContentTypeEnum.GALLERY:
            color = "blue";
            tagLabel = "Gallery";
            break;
        case ContentTypeEnum.COMPONENT:
            color = "green";
            tagLabel = "Component";
            break;
        case ContentTypeEnum.LAYOUT:
            color = "purple";
            tagLabel = "Layout";
            break;
        case ContentTypeEnum.FORM:
            color = "orange";
            tagLabel = "Form";
            break;
        case ContentTypeEnum.PAGE:
            color = "red";
            tagLabel = "Page";
            break;
        default:
            color = "volcano";
            tagLabel = "Unknown";
            break;
    }

    return (
            <Tag color={color} key={tagLabel + recordId}>
                {tagLabel}
            </Tag>
    );
}

function publishStatusEnumToTag(publishStatusEnum: string, recordId: number): JSX.Element {
    let color: PresetColorType;
    let tagLabel: string;

    switch (publishStatusEnum) {
        case PublishStatusEnum.NOT_PUBLISHED:
            color = "yellow";
            tagLabel = "Not published";
            break;
        case PublishStatusEnum.PUBLISHED:
            color = "green";
            tagLabel = "Published";
            break;
        case PublishStatusEnum.PROCESSING:
            color = "blue";
            tagLabel = "Processing";
            break;
        case PublishStatusEnum.CANCELLED:
            color = "red";
            tagLabel = "Cancelled";
            break;
        default:
            color = "volcano";
            tagLabel = "Unknown";
            break;
    }

    return (
            <Tag color={color} key={tagLabel + recordId}>
                {tagLabel}
            </Tag>
    );
}

export {contentTypeEnumToTag, publishStatusEnumToTag};