select 
    m.id,
    m.school_id,
    m.class_id,
    m.kid_id,
    r.grade
from
    members m
    left join school_roles r on m.school_id = r.school_id
    left join schools s on m.school_id = s.id
where
    s.activated = true
    and m.id = '${memberId}'
    and m.user_id = '${userId}';
