select
    array_to_string(array_agg(id),',') as ids
from
    permissions
where
    grade = ${grade};