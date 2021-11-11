select
    array_agg(id) chat_ids
from
    chat_publish
where
    message in ${avAnnIds};