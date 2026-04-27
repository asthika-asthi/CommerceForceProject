import db from '../server/db';

/**
 * Deletes a category by name safely.
 * Usage: npx tsx scripts/delete-category.ts "Category Name"
 */
async function deleteCategoryByName() {
  const categoryName = process.argv[2];

  if (!categoryName) {
    console.error('Error: Please provide a category name.');
    console.log('Usage: npx tsx scripts/delete-category.ts "Category Name"');
    process.exit(1);
  }

  try {
    console.log(`--- Checking category: "${categoryName}" ---`);

    // 1. Check if category exists
    const categoryCheck = await db.query('SELECT id FROM categories WHERE name = ?', [categoryName]);
    
    if (categoryCheck.rows.length === 0) {
      console.warn(`Warning: Category "${categoryName}" does not exist in the database.`);
      return;
    }

    const categoryId = categoryCheck.rows[0].id;

    // 2. Check if category is empty (Safety Check)
    const productCount = await db.query('SELECT COUNT(*) as count FROM products WHERE category = ?', [categoryName]);
    const count = parseInt(productCount.rows[0].count);

    if (count > 0) {
      console.warn(`Warning: Cannot delete "${categoryName}". It is NOT empty (contains ${count} products).`);
      console.log('Safety mechanism: Please move or delete associated products first.');
      return;
    }

    // 3. Perform Deletion
    const deleteResult = await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    console.log(`Success: Category "${categoryName}" (ID: ${categoryId}) has been deleted.`);

  } catch (error) {
    console.error('An unexpected error occurred during deletion:', error);
  } finally {
    process.exit();
  }
}

deleteCategoryByName();
