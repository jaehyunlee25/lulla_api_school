select
    *
from
    demand
where
    id = '${demandId}'
    and role_type = 5
    and confirmed = false
    and is_denied = false;