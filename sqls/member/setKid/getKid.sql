select
    name,
    gender,
    birth,
    image_id,
    (select relation from members where kid_id = '${kidId}') relation
from
    kid
where
    id = '${kidId}';