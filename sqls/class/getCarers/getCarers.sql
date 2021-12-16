select
    *
from
    members m
    left join school_roles sr on sr.id = m.school_role_id
where
    m.school_id = '${schoolId}'
    and m.class_id = '${classId}'
    and sr.grade = 5;