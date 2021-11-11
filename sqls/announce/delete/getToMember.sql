select 
    distinct(to_member_id) to_member_id
from 
    announcement 
where 
    id in ${avAnnIds};