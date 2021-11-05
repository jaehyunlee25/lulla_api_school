insert into 
    members(
        id,
        created_at,
        updated_at,
        user_id,
        class_id,
        school_id,
        school_role_id,
        is_active,
        is_admin
    )
values(
    uuid_generate_v1(),
    now(),
    now(),
    '${userId}',
    '${classId}',
    '${schoolId}',
    '${schoolRoleId}',
    true,
    false
) returning id;