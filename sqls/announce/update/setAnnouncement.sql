update
    announcement
set
    is_record = ${is_record},
    sleep = ${sleep},
    condition = ${condition},
    meal = ${meal},
    temperature = ${temperature},
    defecation = ${defecation},
    is_published = ${is_published},
    is_reserved = ${is_reserved},
    content = '${content}'
where
    id = '${id}';