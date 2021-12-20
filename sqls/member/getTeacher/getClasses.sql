select
    c.id class_id,
    c.name class_name
from
    members m
    left join class c on c.id = m.class_id
    left join school_roles sr on sr.id = m.school_role_id
where
    m.user_id = '${userId}'
    and m.school_id = '${schoolId}'
    and sr.grade = 3;