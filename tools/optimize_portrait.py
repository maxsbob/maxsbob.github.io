"""Create small, color-correct portrait assets; requires Pillow only when run."""

from io import BytesIO
from pathlib import Path

from PIL import Image, ImageCms, ImageOps

assets = Path(__file__).resolve().parents[1] / "assets"
source = assets / "maksim-bobrin.png"
with Image.open(source) as original:
    portrait = ImageOps.exif_transpose(original).convert("RGB")
    if original.info.get("icc_profile"):
        portrait = ImageCms.profileToProfile(
            portrait,
            ImageCms.ImageCmsProfile(BytesIO(original.info["icc_profile"])),
            ImageCms.createProfile("sRGB"),
            outputMode="RGB",
        )
    for width in (180, 360, 540):
        # Match the existing 4:5 CSS cover crop, including vertical position.
        resized = ImageOps.fit(
            portrait,
            (width, width * 5 // 4),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.48),
        )
        target = assets / f"portrait-{width}.webp"
        resized.save(target, "WEBP", quality=84, method=6)
        print(f"{target.name}: {target.stat().st_size:,} bytes")
        if width == 360:
            target = assets / "portrait-360.jpg"
            resized.save(target, "JPEG", quality=86, optimize=True, progressive=True)
            print(f"{target.name}: {target.stat().st_size:,} bytes")
