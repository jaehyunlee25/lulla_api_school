update
    invitation
set
    confirmed = true,
    member_id = '${memberId}'
where
    id = '${invitationId}';