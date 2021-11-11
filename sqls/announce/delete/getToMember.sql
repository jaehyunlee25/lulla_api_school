select 
    distinct(to_member_id) toMemberId
from 
    announcement 
where 
    id in ${avAnnIds};