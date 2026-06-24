import argparse
import sys
from pathlib import Path
from functools import partial
from multiprocessing import Pool

try:
    from PIL import Image, ImageOps
except ImportError:
    print("Error: The 'Pillow' library is required but not found.")
    print("Please install it by running: pip install Pillow")
    sys.exit(1)

MAX_WIDTH = 1600
MAX_HEIGHT = 1200

# Map a user-facing format name to PIL's format string and file extension.
# PIL's save format is the canonical Pillow format identifier; the extension
# is what we give the output file.
FORMAT_INFO = {
    "png": ("PNG", ".png"),
    "jpg": ("JPEG", ".jpg"),
    "jpeg": ("JPEG", ".jpeg"),
    "webp": ("WEBP", ".webp"),
    "gif": ("GIF", ".gif"),
    "bmp": ("BMP", ".bmp"),
    "tiff": ("TIFF", ".tiff"),
    "avif": ("AVIF", ".avif"),
}


def process_image(img_path, pil_format, out_suffix):
    """Worker function to process a single image in a separate process"""
    try:
        new_path = img_path.with_suffix(out_suffix)
        with Image.open(img_path) as img:
            # Apply EXIF rotation if present
            img = ImageOps.exif_transpose(img)

            # thumbnail scales down the image to fit within the box
            # while strictly preserving the aspect ratio.
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)

            # Formats without an alpha channel (e.g. JPEG) need an RGB image.
            if pil_format in ("JPEG", "BMP") and img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")

            img.save(new_path, pil_format)

        return (True, img_path.name, new_path.name, img_path, new_path, None)
    except Exception as e:
        return (False, None, None, img_path, None, str(e))


def parse_args():
    parser = argparse.ArgumentParser(
        description="Resize and convert images, updating markdown references."
    )
    parser.add_argument(
        "-s", "--source",
        default="png",
        help="Source image format/extension to scan for (e.g. png, jpg). Default: png",
    )
    parser.add_argument(
        "-o", "--output",
        default="webp",
        choices=sorted(FORMAT_INFO.keys()),
        help="Output image format. Default: webp",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    source_ext = "." + args.source.lower().lstrip(".")
    pil_format, out_suffix = FORMAT_INFO[args.output.lower()]

    docs_dir = Path("docs")
    images_dir = docs_dir / "images"

    if not images_dir.exists() or not images_dir.is_dir():
        print(f"Error: '{images_dir}' directory not found.")
        return

    # 1. Find all source images recursively in the 'docs/images' directory
    image_paths = []
    for path in images_dir.rglob('*'):
        if path.is_file() and path.suffix.lower() == source_ext:
            image_paths.append(path)

    if not image_paths:
        print(f"No {source_ext} images found in the '{images_dir}' directory.")
        return

    print(f"Found {len(image_paths)} {source_ext} images to process.")

    replacements = {}
    processed_originals = []
    success = True

    # 2. Process images with multiprocessing Pool
    print(f"Processing images in parallel -> {pil_format}...")
    worker = partial(process_image, pil_format=pil_format, out_suffix=out_suffix)
    with Pool() as pool:
        results = pool.map(worker, image_paths)

    for res_success, old_name, new_name, img_path, new_path, err_msg in results:
        if res_success:
            replacements[old_name] = new_name
            processed_originals.append((img_path, new_path))
            print(f"Converted: {img_path.name} -> {new_name}")
        else:
            print(f"Error processing {img_path}: {err_msg}")
            success = False

    if not success:
        print("\nImage processing encountered errors. Aborting markdown updates to be safe.")
        return

    # 3. Scan for and update Markdown files in the docs directory
    md_files = list(docs_dir.glob('*.md'))
    if md_files:
        print(f"\nScanning {len(md_files)} Markdown files for image references...")

        for md_path in md_files:
            try:
                # Read the markdown content
                text = md_path.read_text(encoding='utf-8')
                new_text = text

                # Replace old source filenames with new output filenames
                for old_name, new_name in replacements.items():
                    new_text = new_text.replace(old_name, new_name)

                # Write back only if changes were made
                if new_text != text:
                    md_path.write_text(new_text, encoding='utf-8')
                    print(f"Updated image links in: {md_path.name}")

            except Exception as e:
                print(f"Error updating markdown file {md_path}: {e}")
                success = False

    if not success:
        print("\nMarkdown updates encountered errors. Aborting cleanup.")
        return

    # 4. Final Cleanup Prompt
    print("\nSuccess! All images have been converted and markdown files updated.")

    # An original is only safe to delete if its converted copy is a distinct
    # file. When the output format matches the source extension, the converted
    # image overwrote the original in place, so deleting it would destroy the
    # only remaining copy.
    deletable = []
    for img_path, new_path in processed_originals:
        if new_path.exists() and not new_path.samefile(img_path):
            deletable.append(img_path)

    skipped = len(processed_originals) - len(deletable)
    if skipped:
        print(f"Note: {skipped} original(s) were overwritten in place by the "
              f"conversion and will be kept (deleting would remove the only copy).")

    if not deletable:
        print("No originals to delete.")
        return

    while True:
        ans = input(f"Do you want to permanently delete the {len(deletable)} original {source_ext} files? (y/n): ").strip().lower()
        if ans in ('y', 'yes'):
            for p in deletable:
                try:
                    p.unlink()
                except Exception as e:
                    print(f"Failed to delete {p}: {e}")
            print(f"Cleanup complete. Original {source_ext} files deleted.")
            break
        elif ans in ('n', 'no'):
            print(f"Original {source_ext} files kept.")
            break
        else:
            print("Please enter 'y' or 'n'.")

if __name__ == '__main__':
    main()
