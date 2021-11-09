select
    *
from
    announcement
where
    is_confirmed = false
    and id = '${annId}';