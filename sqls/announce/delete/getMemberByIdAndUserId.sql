select 
    m.id,
    m.school_id,
    m.class_id,
    m.kid_id,
    r.grade
from
    members m
    left join school_roles r on m.school_role_id = r.id
where
    m.id = '${memberId}'
    and m.user_id = '${userId}';
