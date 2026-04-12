# Configuration-Driven UI Guide

This e-commerce platform now supports configuration-driven UI for the Landing and Category pages. This allows for layout and content changes without rebuilding the Docker image or updating the database.

## 📁 File Structure

Configurations are stored in the `/config` directory:
- `/config/default/landing.json`: Default landing page layout.
- `/config/default/category.json`: Default category page layout.
- `/config/{client}/landing.json`: Client-specific landing page override.
- `/config/{client}/category.json`: Client-specific category page override.

## 🚀 Workflow: Updating UI without Rebuild

1. **Modify Config**: Edit the JSON files in the `/config` directory on the host machine.
2. **Refresh**: Refresh the browser. The changes are loaded dynamically by the server on each request (or cached in-memory depending on implementation).
3. **No Rebuild**: Since the `/config` directory is mounted as a volume in Docker, changes on the host are immediately visible inside the container.

## 🐳 Docker Setup

Ensure your `docker-compose.yml` mounts the config directory:

```yaml
services:
  app:
    image: commerceforce-client-a
    volumes:
      - ./config/client-a:/app/config/default
      # OR for multi-tenant support
      - ./config:/app/config
    environment:
      - NODE_ENV=production
```

## 📄 JSON Examples

### Landing Page (`landing.json`)
```json
{
  "hero": {
    "title": "New Season Arrival",
    "subtitle": "Check out our latest collection",
    "image": "https://example.com/hero.jpg",
    "cta_text": "Shop Now",
    "cta_link": "/products"
  },
  "sections": [
    { "type": "features", "enabled": true, "config": { "items": [...] } },
    { "type": "products", "enabled": true, "config": { "title": "Top Picks" } }
  ]
}
```

### Category Page (`category.json`)
```json
{
  "layout": [
    { "type": "banner" },
    { "type": "title" },
    { "type": "product_grid" }
  ]
}
```

## 🎨 Customization Reference

### Landing Page (`landing.json`)

#### Hero Section
| Property | Description |
| :--- | :--- |
| `title` | Main H1 heading |
| `subtitle` | Descriptive text below title |
| `image` | URL to image or .mp4 video |
| `cta_text` | Text for the primary button |
| `cta_link` | URL path (e.g., `/products`) |

#### Featured Products
To manually select products for the landing page:
```json
{
  "featured_products": ["prod_id_1", "prod_id_2", "prod_id_3"]
}
```

#### Section Types
- **`features`**: Highlights key selling points.
- **`promotions`**: Large banners for sales.
- **`products`**: Grid of featured items.
- **`testimonials`**: Customer social proof.
- **`faq`**: Frequently asked questions.
- **`cta`**: Bottom-of-page call to action.

### Category Page (`category.json`)

The `layout` array accepts objects with a `type`:
- `banner`: A full-width image banner using the first product's image.
- `title`: The category name and product count.
- `product_grid`: The main grid of products.

**Pro Tip**: You can duplicate types or reorder them. For example, putting `product_grid` above `title` for a "products-first" look.

---

## 🔄 When is a Rebuild Required?

| Change Type | Rebuild Required? | Action |
|-------------|-------------------|--------|
| UI Layout (Config) | ❌ No | Update JSON file |
| Content (Config) | ❌ No | Update JSON file |
| Products/Categories | ❌ No | Update via Admin/DB |
| New UI Component | ✅ Yes | Add code, then rebuild |
| Backend Logic | ✅ Yes | Update server code, then rebuild |
| Dependency Change | ✅ Yes | Update package.json, then rebuild |
