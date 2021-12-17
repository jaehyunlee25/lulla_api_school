select
    id
from
    permissions
where
    type = ${type}
    and action = ${action}
    and grade = ${grade};