select
    array_agg(file_id) files
from
    announce_file
where
    announce_id = '${annId}';