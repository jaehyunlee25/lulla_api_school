insert into
    drug_cabinet(
        id,
        date,
        is_reserved,
        is_published,
        created_at,
        updated_at,
        member_id,
        signature_id
    )
values(
    uuid_generate_v1(),
    '${date}',
    ${isReserved},
    ${isPublished},
    now(),
    now(),
    '${memberId}',
    '${signatureId}'
) returning id;
