-- Expand check_in_photo_url and check_out_photo_url to MEDIUMTEXT to support Base64 fallback and cloud URLs
ALTER TABLE time_attendances MODIFY COLUMN check_in_photo_url MEDIUMTEXT NULL;
ALTER TABLE time_attendances MODIFY COLUMN check_out_photo_url MEDIUMTEXT NULL;

