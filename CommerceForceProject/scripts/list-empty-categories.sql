-- List categories with zero associated products
SELECT 
    id, 
    name 
FROM 
    categories 
WHERE 
    name NOT IN (
        SELECT DISTINCT category 
        FROM products 
        WHERE category IS NOT NULL 
          AND category != ''
    );


--run directly using exec command on running container
SELECT c.id, c.name 
FROM categories c
LEFT JOIN products p ON c.name = p.category
GROUP BY c.id, c.name
HAVING COUNT(p.id) = 0;


--command on docker to list
docker exec -it <container_id> psql -U postgres -d commerce -c "SELECT c.id, c.name FROM categories c LEFT JOIN products p ON c.name = p.category GROUP BY c.id, c.name HAVING COUNT(p.id) = 0;"