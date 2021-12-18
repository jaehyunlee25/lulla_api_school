select
    c.id class_id,
    c.name class_name
from
    members m
    left join class c on c.id = m.class_id
where
    m.user_id = '${userId}'
    and m.school_id = '${schoolId}';