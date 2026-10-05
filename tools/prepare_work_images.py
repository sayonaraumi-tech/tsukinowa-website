"""Convert an actual Before/After pair to WebP without changing repair content."""
import argparse
import io
import re
from pathlib import Path
from PIL import Image, ImageOps


def save_photo(source, destination):
    with Image.open(source) as original:
        photo = ImageOps.exif_transpose(original).convert('RGB')
        photo.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        # Strip source EXIF; keep the full photo and never retouch or generate content.
        for quality in (86, 82, 78, 74):
            output = io.BytesIO()
            photo.save(output, format='WEBP', quality=quality, method=6)
            if output.tell() <= 300 * 1024:
                break
        destination.write_bytes(output.getvalue())
        print(f'{destination}: {photo.width}x{photo.height}, {output.tell() / 1024:.0f} KB')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('case_id')
    parser.add_argument('before', type=Path)
    parser.add_argument('after', type=Path)
    args = parser.parse_args()
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.case_id):
        parser.error('case_id must use lowercase letters, digits, and hyphens')
    if not args.before.is_file() or not args.after.is_file():
        parser.error('both original photos must exist')
    folder = Path(__file__).resolve().parents[1] / 'assets/images/works/real' / args.case_id
    folder.mkdir(parents=True, exist_ok=True)
    for source, name in [(args.before, 'before'), (args.after, 'after')]:
        destination = folder / f'{name}.webp'
        if source.resolve() == destination.resolve():
            parser.error('use the original photo as input, not the destination')
        save_photo(source, destination)


if __name__ == '__main__':
    main()
