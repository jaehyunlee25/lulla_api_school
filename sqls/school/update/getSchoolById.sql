select 
    *
from
    schools
where
    s.activated = true
    and id = '${schoolId}';