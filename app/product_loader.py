"""
Loads product data from the products/ directory.

Each product lives in products/{slug}/ and contains:
  description.md  - YAML frontmatter + markdown body

Images live in nf-viz/public/assets/{image_folder}/ where image_folder
is specified in the frontmatter. If an explicit `images` list is given in
frontmatter those filenames are used; otherwise all image files in the
folder are discovered automatically (sorted alphabetically).

Frontmatter fields:
  title            str   Product name (required)
  intro            str   Short paragraph shown above the buy button (optional)
  badge            str   Store card badge, e.g. "In Stock"
  store_description str  One-liner for the store grid card
  store_image      str   Filename of the store card hero image
  image_folder     str   Subfolder under assets/, "" for root (default "")
  images           list  Explicit list of filenames; auto-discovers if omitted
  show_in_store    bool  Whether the product appears in the store grid (default true)
  store_order      int   Sort position on the store page (default 99)
  price_id         str   Stripe Price ID (price_xxx) charged at checkout in live mode
  price_id_test    str   Price ID used instead when Stripe is running in test mode
                         (falls back to DEFAULT_TEST_PRICE_ID if omitted, so test
                         checkout always works even before a product is configured)
  variants         list  Optional list of {label, price_id, price_id_test, image}
                         for products sold in multiple variants (e.g. colors).
                         Takes precedence over `price_id`/`price_id_test`, which
                         are used as a single, unlabeled variant when `variants`
                         is absent. `image` (optional) is a filename from `images`
                         the gallery jumps to when that variant is selected.
  shipping_size    str   Which shipping rate to charge: "small", "large", or
                         "free" (default "small"). Looked up per-region in
                         app.main's SHIPPING_REGIONS — the shopper only picks a
                         destination region, not a rate.

The price actually charged depends on which mode the configured Stripe secret
key is in — see `test_mode` below. Live-mode IDs are read straight from
frontmatter; test-mode IDs fall back to a known-good sample price so that test
checkout works out of the box.

Note there is no `price` frontmatter field — display prices are fetched live
from the Stripe API (by `app.main`, which knows about `stripe_client`) and
attached to each variant as `price_display`, so the storefront always reflects
whatever the Price objects actually charge.
"""

import os
import logging
from pathlib import Path
from functools import lru_cache

import frontmatter
import markdown

logger = logging.getLogger(__name__)

# A real test-mode Price ID from the shared sample Stripe account. Used whenever
# a product doesn't define its own `price_id_test` (or `variants[].price_id_test`),
# so test checkout always has something valid to charge against.
DEFAULT_TEST_PRICE_ID = "price_1Tg5tDCIW3Ilocb5fTemCHVu"

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


def _resolve_price_id(fields: dict, test_mode: bool) -> str:
    """Pick the Price ID to charge, honoring whichever Stripe mode is active.

    Live mode uses the frontmatter's `price_id` verbatim (empty if unset, which
    hides the buy button). Test mode prefers `price_id_test` but falls back to
    DEFAULT_TEST_PRICE_ID so test checkout works before a product is configured.
    """
    if test_mode:
        return fields.get("price_id_test") or DEFAULT_TEST_PRICE_ID
    return fields.get("price_id", "")


def load_product(slug: str, asset_bucket_url: str, test_mode: bool = False) -> dict | None:
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

    explicit_variants = meta.get("variants")
    if explicit_variants:
        variants = [
            {
                "label": v.get("label", ""),
                "price_id": _resolve_price_id(v, test_mode),
                "image": v.get("image", ""),
            }
            for v in explicit_variants
        ]
    else:
        price_id = _resolve_price_id(meta, test_mode)
        variants = [{"label": "", "price_id": price_id}] if price_id else []

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
        "badge": meta.get("badge", ""),
        "store_description": meta.get("store_description", ""),
        "store_image_url": store_image_url,
        "image_urls": image_urls,
        "content": html_content,
        "variants": variants,
        "show_in_store": meta.get("show_in_store", True),
        "store_order": meta.get("store_order", 99),
        "shipping_size": meta.get("shipping_size", "small"),
    }


def load_all_products(asset_bucket_url: str, test_mode: bool = False) -> list[dict]:
    """Return all products, sorted by store_order."""
    if not PRODUCTS_DIR.exists():
        return []
    products = []
    for entry in PRODUCTS_DIR.iterdir():
        if entry.is_dir():
            product = load_product(entry.name, asset_bucket_url, test_mode)
            if product:
                products.append(product)
    return sorted(products, key=lambda p: p["store_order"])
