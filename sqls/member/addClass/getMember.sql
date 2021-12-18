select
    m.user_id user_id,
    m.school_id school_id,
    m.class_id class_id,
    sr.name role_name
from
    members m
    left join school_roles sr on sr.id = m.school_role_id 
where
    m.id = '${memberId}'
    and sr.grade = 3;