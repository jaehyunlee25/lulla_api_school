select 
    m.*
from
    members m
    left join school_roles sr on sr.id = m.school_role_id
where
    m.id = '${memberId}'
    and sr.grade = 3;