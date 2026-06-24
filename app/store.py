"""
Stripe-backed storefront: product listing, embedded checkout, and shipping
configuration.

`templates`, `ASSET_BUCKET_URL`, `STRIPE_TEST_MODE`, `SHIPPING_REGIONS`, and
`_enrich_product_pricing` are also used by app.main's catch-all product page
route.
"""

import asyncio
import logging
import os
import time

import stripe
from fastapi import APIRouter, HTTPException, Request
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from .product_loader import load_product, load_all_products

logger = logging.getLogger(__name__)

# Asset bucket URL — baked in at Docker build time (same value Vite uses).
# Falls back to "" in local dev, making image paths relative (e.g. /assets/foo.jpg).
ASSET_BUCKET_URL = os.environ.get("VITE_ASSET_BUCKET_URL", "")

# Stripe Checkout Credentials (Loaded from environment / GCP Secret Manager)
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
stripe_client = stripe.StripeClient(STRIPE_SECRET_KEY)

# Test-mode and live-mode keys reference entirely different Stripe objects, so
# the secret key's prefix tells us which set of Price/Shipping Rate IDs are
# actually valid right now. This lets staging/local (test keys) and production
# (live keys) share the same SHIPPING_REGIONS / product frontmatter.
STRIPE_TEST_MODE = STRIPE_SECRET_KEY.startswith("sk_test_")

# Each shipping region pairs the countries Checkout is allowed to collect an
# address for with the shipping rates that apply to that destination. Scoping
# allowed_countries to match the shipping rate means a customer can never pick
# a cheaper rate and then enter an address outside the region it covers.
#
# `shipping_rates` has one entry per product `shipping_size` (see
# product_loader.py). Each entry's `shipping_rate` is used in live mode and
# must be filled in with real rate IDs from the Stripe dashboard before going
# live; `shipping_rate_test` is used in test mode and defaults to known-good
# rates from the shared sample account. A size missing from `shipping_rates`
# (or missing a `shipping_rate_test`) falls back to the region's
# DEFAULT_SHIPPING_SIZE entry.
DEFAULT_SHIPPING_SIZE = "small"

SHIPPING_REGIONS = {
    "us_ca": {
        "label": "USA / Mexico",
        "allowed_countries": ["US", "MX"],
        "shipping_rates": {
            "small": {
                "shipping_rate": "shr_1T9mMwCIW3Ilocb5ZGx7fAl6",
                "shipping_rate_test": "shr_1TiIWvCIW3Ilocb5b0ZqrQSg",
            },
            "large": {
                "shipping_rate": "shr_1Sw5wpCIW3Ilocb5YgYedbGN",
                "shipping_rate_test": "shr_1Tg61JCIW3Ilocb57St9vBHl",
            },
            "free": {
                "shipping_rate": "shr_1TPMi1CIW3Ilocb5E3SmNgq4",
            },
        },
    },
    "ca": {
        "label": "Canada",
        "allowed_countries": ["CA"],
        "shipping_rates": {
            "small": {
                "shipping_rate": "shr_1TlzkxCIW3Ilocb5xXOHMzqD",
                "shipping_rate_test": "shr_1TiIWvCIW3Ilocb5b0ZqrQSg",
            },
            "large": {
                "shipping_rate": "shr_1TlzlSCIW3Ilocb5kymrKxb1",
                "shipping_rate_test": "shr_1Tg61JCIW3Ilocb57St9vBHl",
            },
            "free": {
                "shipping_rate": "shr_1TPMi1CIW3Ilocb5E3SmNgq4",
            },
        },
    },
    "intl_asia": {
        "label": "Japan, Korea, Taiwan, Australia",
        "allowed_countries": ["JP", "KR", "TW", "AU"],
        "shipping_rates": {
            "small": {
                "shipping_rate": "shr_1TixQiCIW3Ilocb5ZPVS9ndz",
                "shipping_rate_test": "shr_1Tg60eCIW3Ilocb5ICRBVyDo",
            },
            "large": {
                "shipping_rate": "shr_1TegN0CIW3Ilocb5EZz5ZW71",
            },
            "free": {
                "shipping_rate": "shr_1TPMi1CIW3Ilocb5E3SmNgq4",
            },
        },
    },
    "britian": {
        "label": "Britian",
        "allowed_countries": ["GB"],
        "shipping_rates": {
            "small": {
                "shipping_rate": "shr_1TiIJvCIW3Ilocb5Djvew2zk",
                "shipping_rate_test": "shr_1Tg60eCIW3Ilocb5ICRBVyDo",
            },
            "large": {
                "shipping_rate": "shr_1TiIJvCIW3Ilocb5Djvew2zk",
            },
            "free": {
                "shipping_rate": "shr_1TPMi1CIW3Ilocb5E3SmNgq4",
            },
        },
    },

}


def _shipping_rate_for(region: dict, size: str) -> str:
    """Return the shipping rate ID for this region, scaled to a product's shipping size.

    Falls back to the region's DEFAULT_SHIPPING_SIZE rates if `size` isn't
    configured for this region, or (in test mode) if the configured size has
    no `shipping_rate_test` of its own.
    """
    rates = region["shipping_rates"]
    sized_rates = rates.get(size, rates[DEFAULT_SHIPPING_SIZE])
    if STRIPE_TEST_MODE:
        default_rates = rates[DEFAULT_SHIPPING_SIZE]
        return sized_rates.get("shipping_rate_test") or default_rates.get("shipping_rate_test") or default_rates["shipping_rate"]
    return sized_rates["shipping_rate"]


# Ranks shipping sizes so a multi-item cart can be charged the single rate that
# covers its bulkiest item, rather than stacking a rate per item.
_SHIPPING_SIZE_RANK = {"free": 0, "small": 1, "large": 2}


def _combined_shipping_size(sizes: list[str]) -> str:
    """Return the largest shipping size among a cart's items."""
    return max(sizes, key=lambda s: _SHIPPING_SIZE_RANK.get(s, _SHIPPING_SIZE_RANK[DEFAULT_SHIPPING_SIZE]))


# Shown when a Price ID can't be resolved (placeholder ID, Stripe unreachable,
# etc.) so the storefront still has a plausible price instead of going blank.
DEFAULT_PRICE_AMOUNT = 99
DEFAULT_PRICE_CURRENCY = "usd"

# Cached by Price ID, as (info, fetched_at) — caches misses too (placeholder/
# unconfigured IDs would otherwise be re-fetched, and fail, on every page load).
# Entries expire after PRICE_DISPLAY_CACHE_TTL so we eventually pick up changes
# made in the Stripe dashboard without needing a server restart.
PRICE_DISPLAY_CACHE_TTL = 12 * 60 * 60
_PRICE_DISPLAY_CACHE: dict[str, tuple[dict, float]] = {}


def _format_amount(unit_amount: int, currency: str) -> str:
    """Format a Stripe amount (in the smallest currency unit) for display, e.g. "$1000" or "$22.50".

    Assumes a 2-decimal currency (USD) — that's all this store sells in.
    """
    amount = unit_amount / 100
    symbol = "$" if currency == "usd" else f"{currency.upper()} "
    if amount == int(amount):
        return f"{symbol}{int(amount)}"
    return f"{symbol}{amount:.2f}"


async def _get_price_info(price_id: str) -> dict | None:
    """Look up a Price ID via the Stripe API and return its amount, currency, and display string.

    Falls back to DEFAULT_PRICE_AMOUNT/DEFAULT_PRICE_CURRENCY if the lookup
    fails (placeholder ID, Stripe unreachable, etc.) so the storefront always
    shows a price. Returns None only when there's no Price ID at all. Results
    are cached by Price ID for PRICE_DISPLAY_CACHE_TTL.
    """
    if not price_id:
        return None
    cached = _PRICE_DISPLAY_CACHE.get(price_id)
    if cached is None or time.monotonic() - cached[1] > PRICE_DISPLAY_CACHE_TTL:
        try:
            price = await stripe_client.v1.prices.retrieve_async(price_id)
            unit_amount, currency = price.unit_amount, price.currency
        except stripe.StripeError as e:
            logger.warning(f"Could not fetch Stripe price {price_id}: {e}")
            unit_amount, currency = DEFAULT_PRICE_AMOUNT, DEFAULT_PRICE_CURRENCY
        info = {
            "unit_amount": unit_amount,
            "currency": currency,
            "display": _format_amount(unit_amount, currency),
        }
        cached = (info, time.monotonic())
        _PRICE_DISPLAY_CACHE[price_id] = cached
    return cached[0]


async def _get_price_display(price_id: str) -> str | None:
    """Look up a Price ID and return just its formatted display string (see _get_price_info)."""
    info = await _get_price_info(price_id)
    return info["display"] if info else None


async def _enrich_product_pricing(product: dict) -> dict:
    """Attach live Stripe prices to a product in place.

    Sets `price_display` on each variant, and a top-level `price_display`
    (the first variant's price) for the store grid card and page header.
    """
    variants = product["variants"]
    if variants:
        displays = await asyncio.gather(*(_get_price_display(v["price_id"]) for v in variants))
        for variant, display in zip(variants, displays):
            variant["price_display"] = display
        product["price_display"] = variants[0]["price_display"]
    else:
        product["price_display"] = None
    return product


# Cart icon shared by store.html, product.html, and cart.html navbars.
CART_ICON_URL = f"{ASSET_BUCKET_URL}/assets/shopping-bag.svg"

templates = Jinja2Templates(directory="app/templates")

router = APIRouter()


@router.get("/store")
async def store_page(request: Request):
    products = load_all_products(ASSET_BUCKET_URL, STRIPE_TEST_MODE)
    await asyncio.gather(*(_enrich_product_pricing(p) for p in products))
    return templates.TemplateResponse(request, "store.html", {"products": products, "cart_icon_url": CART_ICON_URL})


class CartLineItem(BaseModel):
    """A single product/variant/quantity entry, as stored in the client-side cart."""
    slug: str
    variant: int = 0
    quantity: int = Field(default=1, ge=1, le=20)


class CreateCheckoutSessionRequest(BaseModel):
    """Payload sent by the checkout page once the shopper has chosen a shipping region and the cart (or single buy-now item) is finalized."""
    region: str
    items: list[CartLineItem]
    cart_mode: bool = False


def _get_variant(product: dict, variant_index: int) -> dict | None:
    variants = product.get("variants") or []
    if 0 <= variant_index < len(variants):
        return variants[variant_index]
    return None


@router.get("/cart")
async def cart_page(request: Request):
    return templates.TemplateResponse(request, "cart.html", {
        "shipping_regions": SHIPPING_REGIONS,
        "cart_icon_url": CART_ICON_URL,
    })


@router.post("/cart-items")
async def cart_items(items: list[CartLineItem]):
    """Enriches a localStorage cart (slug/variant/quantity) with display info for the cart page."""
    async def build(item: CartLineItem):
        product = load_product(item.slug, ASSET_BUCKET_URL, STRIPE_TEST_MODE)
        if product is None:
            return None
        variant = _get_variant(product, item.variant)
        if variant is None:
            return None
        price_info = await _get_price_info(variant.get("price_id"))
        return {
            "slug": item.slug,
            "variant": item.variant,
            "quantity": item.quantity,
            "title": product["title"],
            "variant_label": variant.get("label", ""),
            "image_url": product["store_image_url"],
            "price_display": price_info["display"] if price_info else "Price unavailable",
            "unit_amount": price_info["unit_amount"] if price_info else 0,
            "currency": price_info["currency"] if price_info else "usd",
        }

    results = await asyncio.gather(*(build(item) for item in items))
    return [r for r in results if r is not None]


@router.get("/checkout/{slug}")
async def checkout_page(request: Request, slug: str, region: str, variant: int = 0):
    """Renders the embedded Stripe Checkout for a single product/variant (the "Buy Now" flow), scoped to a shipping region chosen on the product page."""
    product = load_product(slug, ASSET_BUCKET_URL, STRIPE_TEST_MODE)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    if _get_variant(product, variant) is None:
        raise HTTPException(status_code=400, detail="Unknown product variant")

    if region not in SHIPPING_REGIONS:
        raise HTTPException(status_code=400, detail="Unknown shipping region")

    await _enrich_product_pricing(product)

    return templates.TemplateResponse(request, "checkout.html", {
        "product": product,
        "variant_index": variant,
        "region": region,
        "shipping_regions": SHIPPING_REGIONS,
        "stripe_publishable_key": STRIPE_PUBLISHABLE_KEY,
        "items": [{"slug": slug, "variant": variant, "quantity": 1}],
        "cart_mode": False,
    })


@router.get("/checkout")
async def cart_checkout_page(request: Request, region: str):
    """Renders the embedded Stripe Checkout for the shopper's full cart, read from localStorage on the client."""
    if region not in SHIPPING_REGIONS:
        raise HTTPException(status_code=400, detail="Unknown shipping region")

    return templates.TemplateResponse(request, "checkout.html", {
        "product": None,
        "variant_index": 0,
        "region": region,
        "shipping_regions": SHIPPING_REGIONS,
        "stripe_publishable_key": STRIPE_PUBLISHABLE_KEY,
        "items": None,
        "cart_mode": True,
    })


@router.post("/create-checkout-session")
async def create_checkout_session(request: Request, payload: CreateCheckoutSessionRequest):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    region = SHIPPING_REGIONS.get(payload.region)
    if region is None:
        raise HTTPException(status_code=400, detail="Unknown shipping region")

    line_items = []
    shipping_sizes = []
    for item in payload.items:
        product = load_product(item.slug, ASSET_BUCKET_URL, STRIPE_TEST_MODE)
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.slug}")

        variant = _get_variant(product, item.variant)
        if variant is None or not variant.get("price_id"):
            raise HTTPException(status_code=400, detail=f"Unknown product variant: {item.slug}")

        line_items.append({"price": variant["price_id"], "quantity": item.quantity})
        shipping_sizes.append(product["shipping_size"])

    shipping_size = _combined_shipping_size(shipping_sizes)

    cart_flag = "true" if payload.cart_mode else "false"
    return_url = f"{str(request.base_url).rstrip('/')}/checkout-return?session_id={{CHECKOUT_SESSION_ID}}&cart={cart_flag}"

    try:
        session = stripe_client.v1.checkout.sessions.create(params={
            "ui_mode": "embedded_page",
            "line_items": line_items,
            "mode": "payment",
            "return_url": return_url,
            "allow_promotion_codes": True,
            "automatic_tax": {"enabled": True},
            "shipping_address_collection": {
                "allowed_countries": region["allowed_countries"],
            },
            "shipping_options": [
                {"shipping_rate": _shipping_rate_for(region, shipping_size)},
            ],
        })
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"clientSecret": session.client_secret}


# Session IDs for which we've already set receipt_email on the PaymentIntent.
# In-memory is fine for a low-volume store — worst case is one extra receipt on
# server restart, which is harmless.
_receipt_email_sent: set[str] = set()


@router.get("/session-status")
async def session_status(session_id: str):
    try:
        session = stripe_client.v1.checkout.sessions.retrieve(session_id)
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    customer_email = session.customer_details.email if session.customer_details else None

    # The Dashboard "send receipts" setting is ignored for API-created payments
    # unless receipt_email is explicitly set on the PaymentIntent. Do that once
    # per completed session, immediately after we confirm it's paid.
    if (
        session.status == "complete"
        and customer_email
        and session.payment_intent
        and session_id not in _receipt_email_sent
    ):
        try:
            await stripe_client.v1.payment_intents.update_async(
                session.payment_intent,
                params={"receipt_email": customer_email},
            )
            _receipt_email_sent.add(session_id)
        except stripe.StripeError as e:
            logger.warning(f"Could not set receipt_email on {session.payment_intent}: {e}")

    return {"status": session.status, "customer_email": customer_email}


@router.get("/checkout-return")
async def checkout_return(request: Request):
    return templates.TemplateResponse(request, "checkout_return.html", {})
