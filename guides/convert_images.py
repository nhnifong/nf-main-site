import os
import sys
from pathlib import Path
from multiprocessing import Pool

try:
    from PIL import Image, ImageOps
except ImportError:
    print("Error: The 'Pillow' library is required but not found.")
    print("Please install it by running: pip install Pillow")
    sys.exit(1)

MAX_WIDTH = 1600
MAX_HEIGHT = 1200

def process_image(img_path):
    """Worker function to process a single image in a separate process"""
    try:
        new_path = img_path.with_suffix('.png')
        with Image.open(img_path) as img:
            # Apply EXIF rotation if present
            img = ImageOps.exif_transpose(img)
            
            # thumbnail scales down the image to fit within the box 
            # while strictly preserving the aspect ratio.
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)
            
            img.save(new_path, "PNG")
            
        return (True, img_path.name, new_path.name, img_path, None)
    except Exception as e:
        return (False, None, None, img_path, str(e))


def main():
    docs_dir = Path("docs")
    images_dir = docs_dir / "images"
    
    if not images_dir.exists() or not images_dir.is_dir():
        print(f"Error: '{images_dir}' directory not found.")
        return

    # 1. Find all jpegs recursively in the 'docs/images' directory
    image_paths = []
    for path in images_dir.rglob('*'):
        if path.is_file() and path.suffix.lower() in ('.jpg', '.jpeg'):
            image_paths.append(path)

    if not image_paths:
        print(f"No JPEG images found in the '{images_dir}' directory.")
        return

    print(f"Found {len(image_paths)} JPEG images to process.")

    replacements = {}
    processed_originals = []
    success = True

    # 2. Process images with multiprocessing Pool
    print("Processing images in parallel...")
    with Pool() as pool:
        results = pool.map(process_image, image_paths)
        
    for res_success, old_name, new_name, img_path, err_msg in results:
        if res_success:
            replacements[old_name] = new_name
            processed_originals.append(img_path)
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
                
                # Replace old jpeg filenames with new png filenames
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
    
    while True:
        ans = input(f"Do you want to permanently delete the {len(processed_originals)} original JPEG files? (y/n): ").strip().lower()
        if ans in ('y', 'yes'):
            for p in processed_originals:
                try:
                    p.unlink()
                except Exception as e:
                    print(f"Failed to delete {p}: {e}")
            print("Cleanup complete. Original JPEGs deleted.")
            break
        elif ans in ('n', 'no'):
            print("Original JPEG files kept.")
            break
        else:
            print("Please enter 'y' or 'n'.")

if __name__ == '__main__':
    main()