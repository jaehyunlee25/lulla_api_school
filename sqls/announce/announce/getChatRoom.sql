select 
    * 
from 
    chat_room
where 
    cardinality(members) = 2
    and '${memberId}' = any(members)
    and '${toMemberId}' = any(members);
