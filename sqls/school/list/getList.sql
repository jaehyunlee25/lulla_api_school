select
    id,
    name,
    address
from
    schools
where
    activated =true
    and name like '%${search}%';