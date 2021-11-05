insert into
    kid(
        id,
        name,
        created_at,
        updated_at
    )
values(
    uuid_generate_v1(),
    '${kidName}',
    now(),
    now()
) returning id;