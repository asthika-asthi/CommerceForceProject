-- REPLACEMENT: Change 'Your Category Name' to the name you want to delete
DELETE FROM categories 
WHERE name = 'Your Category Name' 
AND name NOT IN (
    -- Subquery ensures we only delete if 0 products use this category name
    SELECT DISTINCT category 
    FROM products 
    WHERE category IS NOT NULL
);

-- VERIFICATION: Run this after to see if the record was removed
-- SELECT * FROM categories WHERE name = 'Your Category Name';

DELETE FROM categories 
WHERE name = 'ENTER_CATEGORY_NAME_HERE' 
AND NOT EXISTS (
    SELECT 1 FROM products p 
    WHERE p.category = 'ENTER_CATEGORY_NAME_HERE'
);
--command to run directly on teh conatiner
docker exec -it <container_id> psql -U postgres -d commerce -c "SELECT c.id, c.name FROM categories c LEFT JOIN products p ON c.name = p.category GROUP BY c.id, c.name HAVING COUNT(p.id) = 0;"