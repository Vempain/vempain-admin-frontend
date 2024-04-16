import {AbstractPermissionVO} from "../../AbstractPermissionVO";

export default interface CommonFileVO extends AbstractPermissionVO {
    comment: string;
    file_class_id: number;
    id: number;
    metadata: string;
    mimetype: string;
    original_date_time: Date;
    original_document_id: number;
    original_second_fraction: number;
    site_filename: string;
    site_filepath: string;
    site_filesize: number;
    site_sha1sum: string;
    converted_file: string;
    converted_filesize: number;
    converted_sha1sum: string;
}
