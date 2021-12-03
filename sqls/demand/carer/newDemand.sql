insert into
    demand(
        id,
        relation,
        user_id,
        school_id,
        class_id,
        role_type,
        kid_id,
        created_at,
        updated_at
    )
values(
    uuid_generate_v1(),
    '${relation}',
    '${userId}',
    '${schoolId}',
    '${classId}',
    '${roleType}',
    '${kidId}',
    now(),
    now()
) returning id;