update 
    schools
set
    ${strSets}
where
    activated = true
    and id = '${schoolId}';
