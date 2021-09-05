select 
    *
from
    schools
where
    activated = true
    and id = '${schoolId}';