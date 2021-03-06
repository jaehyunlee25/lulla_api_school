insert into 
    announcement(
        id,
        date,
        condition,
        meal,
        temperature,
        defecation,
        created_at,
        updated_at,
        member_id,
        is_published,
        is_reserved,
        content,
        to_member_id,
        -- chat_id,
        is_record,
        sleep
    )
values(
    uuid_generate_v1(),
    '${date}',
    ${condition},
    ${meal},
    ${temperature},
    ${defecation},
    now(),
    now(),
    '${memberId}',
    ${isPublished},
    ${isReserved},
    '${content}',
    '${toMemberId}',
    -- '${chatId}',
    ${isRecord},
    ${sleep}
) returning id;
