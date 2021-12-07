select 
    *
from
    demand
where 
    confirmed = false
	and is_denied = false
	and user_id = '${userId}'
	and kid_id = '${kidId}';