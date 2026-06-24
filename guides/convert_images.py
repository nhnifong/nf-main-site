import argparse
import re
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

# Directories never scanned for reference files (dependencies, build output, vcs).
SKIP_REF_DIRS = {"node_modules", "venv", ".venv", "dist", "build", ".git", "temp_protos", "__pycache__"}

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


def process_image(img_path, pil_format, out_suffix, max_width, max_height):
    """Worker function to process a single image in a separate process"""
    try:
        new_path = img_path.with_suffix(out_suffix)
        with Image.open(img_path) as img:
            # Apply EXIF rotation if present
            img = ImageOps.exif_transpose(img)

            # thumbnail scales down the image to fit within the box while strictly
            # preserving the aspect ratio. A box dimension of 0 disables resizing.
            if max_width and max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

            # Formats without an alpha channel (e.g. JPEG) need an RGB image.
            if pil_format in ("JPEG", "BMP") and img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")

            img.save(new_path, pil_format)

        return (True, img_path.name, new_path.name, img_path, new_path, None)
    except Exception as e:
        return (False, None, None, img_path, None, str(e))


def parse_args():
    parser = argparse.ArgumentParser(
        description="Resize and convert images, updating references to them in text files."
    )
    parser.add_argument(
        "-s", "--source",
        default="png",
        help="Comma-separated source image extensions to scan for (e.g. 'png' or 'png,jpg'). Default: png",
    )
    parser.add_argument(
        "-o", "--output",
        default="webp",
        choices=sorted(FORMAT_INFO.keys()),
        help="Output image format. Default: webp",
    )
    parser.add_argument(
        "-i", "--images-dir",
        default="docs/images",
        help="Directory to scan recursively for source images. Default: docs/images",
    )
    parser.add_argument(
        "-r", "--ref-dir",
        default="docs",
        help="Directory to scan recursively for files that reference the images. Default: docs",
    )
    parser.add_argument(
        "-e", "--ref-ext",
        default="md",
        help="Comma-separated extensions of reference files to update (e.g. 'md' or 'html,ts,css'). Default: md",
    )
    parser.add_argument(
        "--max-width", type=int, default=1600,
        help="Max output width in px; downscale preserving aspect ratio. 0 disables resizing. Default: 1600",
    )
    parser.add_argument(
        "--max-height", type=int, default=1200,
        help="Max output height in px; downscale preserving aspect ratio. 0 disables resizing. Default: 1200",
    )
    return parser.parse_args()


def find_images(images_dir, source_exts):
    image_paths = []
    for path in images_dir.rglob('*'):
        if path.is_file() and path.suffix.lower() in source_exts:
            image_paths.append(path)
    return image_paths


def find_ref_files(ref_dir, ref_exts):
    ref_files = []
    for path in ref_dir.rglob('*'):
        if not path.is_file() or path.suffix.lower() not in ref_exts:
            continue
        if any(part in SKIP_REF_DIRS for part in path.parts):
            continue
        ref_files.append(path)
    return ref_files


def update_references(ref_files, replacements):
    """Replace each old filename with its new one across the reference files.

    Matches whole filename tokens only: a left boundary that is not a filename
    character (so 'face.png' is not matched inside 'interface.png') but does
    allow a preceding path separator, and a right boundary that is not a word
    character. Returns the number of files changed.
    """
    # Longest names first so a name can't be matched as a prefix of another.
    patterns = [
        (re.compile(r'(?<![\w.\-])' + re.escape(old) + r'(?![\w])'), new)
        for old, new in sorted(replacements.items(), key=lambda kv: -len(kv[0]))
    ]

    changed = 0
    for ref_path in ref_files:
        try:
            text = ref_path.read_text(encoding='utf-8')
        except (UnicodeDecodeError, OSError):
            continue  # skip binary or unreadable files
        new_text = text
        for pattern, new in patterns:
            new_text = pattern.sub(new, new_text)
        if new_text != text:
            ref_path.write_text(new_text, encoding='utf-8')
            print(f"Updated references in: {ref_path}")
            changed += 1
    return changed


def main():
    args = parse_args()

    source_exts = {"." + e.strip().lower().lstrip(".") for e in args.source.split(",") if e.strip()}
    ref_exts = {"." + e.strip().lower().lstrip(".") for e in args.ref_ext.split(",") if e.strip()}
    pil_format, out_suffix = FORMAT_INFO[args.output.lower()]

    images_dir = Path(args.images_dir)
    ref_dir = Path(args.ref_dir)

    if not images_dir.is_dir():
        print(f"Error: images directory '{images_dir}' not found.")
        return

    exts_label = "/".join(sorted(e.lstrip('.') for e in source_exts))

    # 1. Find all source images recursively in the images directory
    image_paths = find_images(images_dir, source_exts)
    if not image_paths:
        print(f"No {exts_label} images found in '{images_dir}'.")
        return

    print(f"Found {len(image_paths)} {exts_label} images to process in '{images_dir}'.")

    # Warn about duplicate basenames: reference updates key on filename, so two
    # images sharing a name in different folders would be indistinguishable.
    seen = {}
    for p in image_paths:
        seen.setdefault(p.name, []).append(p)
    dupes = {name: paths for name, paths in seen.items() if len(paths) > 1}
    if dupes:
        print("\nWarning: duplicate image filenames found; reference updates may be ambiguous:")
        for name, paths in dupes.items():
            print(f"  {name}: {', '.join(str(p) for p in paths)}")
        print()

    replacements = {}
    processed_originals = []
    success = True

    # 2. Process images with multiprocessing Pool
    print(f"Processing images in parallel -> {pil_format}...")
    worker = partial(process_image, pil_format=pil_format, out_suffix=out_suffix,
                     max_width=args.max_width, max_height=args.max_height)
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
        print("\nImage processing encountered errors. Aborting reference updates to be safe.")
        return

    # 3. Scan for and update reference files
    ref_files = find_ref_files(ref_dir, ref_exts)
    ref_label = "/".join(sorted(e.lstrip('.') for e in ref_exts))
    if not ref_files:
        print(f"\nNo {ref_label} reference files found in '{ref_dir}'.")
    else:
        print(f"\nScanning {len(ref_files)} {ref_label} files in '{ref_dir}' for image references...")
        update_references(ref_files, replacements)

    # 4. Final Cleanup Prompt
    print("\nSuccess! All images have been converted and references updated.")

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
        ans = input(f"Do you want to permanently delete the {len(deletable)} original {exts_label} files? (y/n): ").strip().lower()
        if ans in ('y', 'yes'):
            for p in deletable:
                try:
                    p.unlink()
                except Exception as e:
                    print(f"Failed to delete {p}: {e}")
            print(f"Cleanup complete. {len(deletable)} original files deleted.")
            break
        elif ans in ('n', 'no'):
            print("Original files kept.")
            break
        else:
            print("Please enter 'y' or 'n'.")

if __name__ == '__main__':
    main()
