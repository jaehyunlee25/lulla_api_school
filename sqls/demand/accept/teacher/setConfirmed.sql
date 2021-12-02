update
    demand
set
    confirmed = true,
    member_id = '${memberId}'
where
    id = '${demandId}';