import db from '../server/db';

async function listEmptyCategories() {
  try {
    console.log('--- Scanning for Empty Categories ---');
    
    /**
     * An "empty" category is defined as a record in the 'categories' table 
     * where no corresponding 'category' string exists in the 'products' table.
     */
    const query = `
      SELECT c.id, c.name 
      FROM categories c
      LEFT JOIN products p ON c.name = p.category
      GROUP BY c.id
      HAVING COUNT(p.id) = 0
    `;

    const result = await db.query(query);

    if (result.rows.length === 0) {
      console.log('No empty categories found. All categories have associated products.');
    } else {
      console.log(`Found ${result.rows.length} empty categories:`);
      console.table(result.rows);
    }
  } catch (error) {
    console.error('Error listing categories:', error);
  } finally {
    process.exit();
  }
}

listEmptyCategories();
