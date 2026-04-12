# CI/CD & Deployment Guide

This guide explains how to manage the separation of **Code**, **Configuration**, and **Data** using the new dynamic UI system and CI/CD pipelines.

## 🏗️ Architecture Overview

To achieve rapid iteration without downtime or constant rebuilds, we separate the application into three layers:

1.  **Code (Docker Image)**: The core logic, React components, and server. Built once and deployed to a registry.
2.  **Configuration (JSON Files)**: UI layouts, Hero content, and feature flags. Managed via Git and synced to Docker volumes.
3.  **Data (Database)**: Products, Users, and Orders. Managed via the Admin UI or database migrations.

---

## 🐳 Docker Build System

### 1. Building the Base Image
The Docker image should contain the application code but **not** the environment-specific configurations.

```bash
# Build the production image
docker build -t commerceforce:latest .
```

### 2. Running with Volumes (The "Magic" Step)
When deploying, you mount the configuration directory from the host machine into the container. This allows you to update the UI without restarting the container.

```bash
docker run -d \
  -p 3000:3000 \
  -v /opt/commerceforce/config:/app/config \
  -e NODE_ENV=production \
  commerceforce:latest
```

---

## 🔄 CI/CD Pipeline Strategy

### Pipeline A: Code Pipeline (Trigger: Code Changes)
1.  **Lint & Test**: Run `npm run lint` and `npm test`.
2.  **Build**: Build the Docker image.
3.  **Push**: Push to Docker Hub / AWS ECR / Google Artifact Registry.
4.  **Deploy**: Update the container service (e.g., ECS, Cloud Run, K8s) to use the new image.

### Pipeline B: Config Pipeline (Trigger: Config Changes)
This pipeline is much faster because it doesn't involve building code.
1.  **Validate**: Run a JSON schema validator on `/config/*.json`.
2.  **Sync**: Use `rsync`, `scp`, or a Git-sync sidecar to update the files in the mounted volume on the production server.
3.  **Result**: The UI updates instantly on the next page refresh.

---

## 🛠️ Customizing the Landing Page

To customize the landing page, edit `/config/default/landing.json`.

### Hero Section Schema
```json
"hero": {
  "title": "Professional Gear for Pros",
  "subtitle": "High-performance tools for your daily workflow.",
  "image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
  "cta_text": "View Catalog",
  "cta_link": "/products"
}
```

### Adding/Removing Sections
The `sections` array determines the order and visibility of UI blocks:

| Section Type | Purpose |
| :--- | :--- |
| `hero` | Main banner with CTA |
| `features` | 3-column icon/text grid |
| `products` | Featured product grid |
| `testimonials` | Customer reviews |
| `faq` | Accordion for common questions |
| `cta` | Simple banner with a button |

**Example: Moving FAQ above Products**
Simply reorder the objects in the `sections` array in `landing.json`.

---

## 💾 Keeping Database & Config Separate

| Feature | Store in Database? | Store in Config File? |
| :--- | :--- | :--- |
| Product Prices | ✅ Yes | ❌ No |
| Inventory Levels | ✅ Yes | ❌ No |
| **Hero Headline** | ❌ No | ✅ Yes |
| **Page Layout Order** | ❌ No | ✅ Yes |
| User Accounts | ✅ Yes | ❌ No |
| **Feature Flags** | ❌ No | ✅ Yes |

### Why this separation?
- **Database**: For dynamic, user-generated, or frequently changing transactional data.
- **Config Files**: For design-related, structural, or marketing-led content that requires version control (Git) but shouldn't require a developer to change a database row.
