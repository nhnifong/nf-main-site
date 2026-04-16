"""
Loads product data from the products/ directory.

Each product lives in products/{slug}/ and contains:
  description.md  - YAML frontmatter + markdown body
  buy-button.html - Stripe (or other) buy button snippet (optional)

Images live in nf-viz/public/assets/{image_folder}/ where image_folder
is specified in the frontmatter. If an explicit `images` list is given in
frontmatter those filenames are used; otherwise all image files in the
folder are discovered automatically (sorted alphabetically).

Frontmatter fields:
  title            str   Product name (required)
  intro            str   Short paragraph shown above the buy button (optional)
  price            str   e.g. "$210" (optional)
  shipping         str   e.g. "Ships in 5-8 days within the United States"
  badge            str   Store card badge, e.g. "In Stock"
  store_description str  One-liner for the store grid card
  store_image      str   Filename of the store card hero image
  image_folder     str   Subfolder under assets/, "" for root (default "")
  images           list  Explicit list of filenames; auto-discovers if omitted
  show_in_store    bool  Whether the product appears in the store grid (default true)
  store_order      int   Sort position on the store page (default 99)
"""

import os
import logging
from pathlib import Path
from functools import lru_cache

import frontmatter
import markdown

logger = logging.getLogger(__name__)

PRODUCTS_DIR = Path("products")
ASSETS_DIR = Path("nf-viz/public/assets")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def _image_url(asset_bucket_url: str, image_folder: str, filename: str) -> str:
    if image_folder:
        return f"{asset_bucket_url}/assets/{image_folder}/{filename}"
    return f"{asset_bucket_url}/assets/{filename}"


def _discover_images(image_folder: str) -> list[str]:
    """Return sorted list of image filenames from the assets subfolder."""
    folder = ASSETS_DIR / image_folder if image_folder else ASSETS_DIR
    if not folder.exists():
        logger.warning(f"Image folder not found: {folder}")
        return []
    return sorted(
        f.name for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    )


def load_product(slug: str, asset_bucket_url: str) -> dict | None:
    """Load and return a single product dict, or None if not found."""
    product_dir = PRODUCTS_DIR / slug
    desc_path = product_dir / "description.md"

    if not desc_path.exists():
        return None

    post = frontmatter.load(str(desc_path))
    meta = post.metadata

    html_content = markdown.markdown(
        post.content,
        extensions=["tables", "extra", "attr_list"],
    )

    buy_button_path = product_dir / "buy-button.html"
    buy_button = buy_button_path.read_text() if buy_button_path.exists() else ""

    image_folder = meta.get("image_folder", "")
    explicit_images = meta.get("images")
    filenames = explicit_images if explicit_images else _discover_images(image_folder)

    image_urls = [_image_url(asset_bucket_url, image_folder, f) for f in filenames]

    store_image_file = meta.get("store_image", filenames[0] if filenames else "")
    store_image_url = _image_url(asset_bucket_url, image_folder, store_image_file) if store_image_file else ""

    return {
        "slug": slug,
        "title": meta.get("title", slug),
        "intro": meta.get("intro", ""),
        "price": meta.get("price", ""),
        "shipping": meta.get("shipping", ""),
        "badge": meta.get("badge", ""),
        "store_description": meta.get("store_description", ""),
        "store_image_url": store_image_url,
        "image_urls": image_urls,
        "content": html_content,
        "buy_button": buy_button,
        "show_in_store": meta.get("show_in_store", True),
        "store_order": meta.get("store_order", 99),
    }


def load_all_products(asset_bucket_url: str) -> list[dict]:
    """Return all products, sorted by store_order."""
    if not PRODUCTS_DIR.exists():
        return []
    products = []
    for entry in PRODUCTS_DIR.iterdir():
        if entry.is_dir():
            product = load_product(entry.name, asset_bucket_url)
            if product:
                products.append(product)
    return sorted(products, key=lambda p: p["store_order"])
