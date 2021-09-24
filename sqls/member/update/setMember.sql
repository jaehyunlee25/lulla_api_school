update
    members
set
    nickname='${nickname}',
    description='${description}',
    image_id='${imageId}',
    background_image_id='${backgroundImageId}'
where
    id = '${memberId}';