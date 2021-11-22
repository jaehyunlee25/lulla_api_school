select
    *
from
    demand
where
    id = '${demandId}'
    and role_type = 3
    and confirmed = false
    and is_denied = false;;