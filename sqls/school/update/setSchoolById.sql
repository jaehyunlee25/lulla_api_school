update 
    schools
set
    ${strSets}
where
    s.activated = true
    and id = '${schoolId}';
