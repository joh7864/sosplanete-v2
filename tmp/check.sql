SELECT 
  iy.id, 
  iy."schoolYear", 
  iy."isOpen", 
  i."schoolName",
  (SELECT COUNT(*) FROM "Period" p WHERE p."instanceYearId" = iy.id) as periods,
  (SELECT COUNT(*) FROM "Team" t WHERE t."instanceYearId" = iy.id) as teams,
  (SELECT COUNT(*) FROM "Category" c WHERE c."instanceYearId" = iy.id) as categories
FROM "InstanceYear" iy 
JOIN "Instance" i ON i.id = iy."instanceId";
