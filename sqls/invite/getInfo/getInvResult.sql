select 
	 i.id invitation_id,
	 i.school_id,
	 s.name school_name,
	 i.class_id class_id,
	 case when c.name is null then '' else c.name end class_name,
	 i.phone,
	 i.role_name,
	 case i.kid_name when '원생' then '' else i.kid_name end kid_name
from 
	invitation i
	left join schools s on s.id = i.school_id
	left join class c on c.id = i.class_id
where
	i.id = '${invId}';