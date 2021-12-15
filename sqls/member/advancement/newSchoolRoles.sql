insert into
    school_roles(
        id,
        school_id,
        grade,
        name,
        description,
        created_at,
        updated_at
    )
values(
    uuid_generate_v1(),
    '${schoolId}',
    2,
    '${roleName}',
    '',
    now(),
    now()
) returning id;
