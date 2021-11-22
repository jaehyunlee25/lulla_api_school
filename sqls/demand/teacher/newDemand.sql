insert into
    demand(
        id,
        user_id,
        school_id,
        class_id,
        role_type,
        created_at,
        updated_at
    )
values(
    uuid_generate_v1(),
    '${userId}',
    '${schoolId}',
    '${classId}',
    '${roleType}',
    now(),
    now()
) returning id;