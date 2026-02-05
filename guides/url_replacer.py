import os
import re
from mkdocs.utils import log

# We use an environment variable to determine if we should replace URLs.
# In Cloud Build, this will be set to the inactive bucket URL.
# Locally, it will be unset, so you can still view docs relative to the repo.
ASSET_BUCKET_URL = os.environ.get('ASSET_BUCKET_URL')

def on_page_markdown(markdown, page, config, files):
    """
    Prepends the Asset Bucket URL to markdown images and links if the 
    ASSET_BUCKET_URL environment variable is present.
    """
    if not ASSET_BUCKET_URL:
        # Silently return if no bucket is configured (Standard local behavior)
        return markdown

    # This regex looks for Markdown image or link patterns starting with assets/ or images/
    # Pattern: [text](assets/...) or ![text](images/...)
    pattern = re.compile(r"(!?\[.*\]\()(?P<path>(?:assets|images).+?)(\)(?:\{.*\})?)")

    def replace_url(match):
        original_path = match.group('path')
        # Ensure we don't have double slashes if the path starts with /
        clean_path = original_path.lstrip('/')
        
        # We append /guides/ to match where sync-assets puts them in GCS
        new_url = f"{ASSET_BUCKET_URL}/guides/{clean_path}"
        
        log.info(f"URL Replacer: {original_path} -> {new_url}")
        return f"{match.group(1)}{new_url}{match.group(3)}"

    return pattern.sub(replace_url, markdown)