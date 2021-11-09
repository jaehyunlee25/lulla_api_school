select 
    * 
from 
    member_permissions mp
	left join permissions p on p.id = any(mp.permissions)
where 
	mp.member_id = '${memberId}'
	and type = ${type}
	and action = ${action};