#!/usr/bin/env python3
"""
package_eb.py - Creates a 100% Linux/POSIX-compliant Elastic Beanstalk deployment ZIP.
Ensures forward slashes '/', Unix file permissions (0644/0755), and Unix LF line endings.
"""

import os
import zipfile
import io

def create_eb_bundle(output_zip="eb-deployment.zip"):
    files_to_pack = [
        ("Dockerrun.aws.json", "Dockerrun.aws.json"),
        (".ebextensions/01_env.config", ".ebextensions/01_env.config")
    ]

    print(f"[*] Packaging Elastic Beanstalk deployment bundle: {output_zip}...")
    
    with zipfile.ZipFile(output_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for local_path, arcname in files_to_pack:
            if not os.path.exists(local_path):
                print(f"[WARN] Warning: {local_path} does not exist, skipping.")
                continue

            with open(local_path, "rb") as f:
                content = f.read()

            # Normalize line endings to Unix LF (\n)
            content = content.replace(b"\r\n", b"\n")

            # Force POSIX forward slashes in archive path
            clean_arcname = arcname.replace("\\", "/")

            zinfo = zipfile.ZipInfo(clean_arcname)
            # Set Unix file attributes: rw-r--r-- (0644)
            zinfo.external_attr = (0o644 | 0o100000) << 16
            zinfo.compress_type = zipfile.ZIP_DEFLATED

            zf.writestr(zinfo, content)
            print(f"  + Added {clean_arcname} (POSIX normalized, {len(content)} bytes)")

    print(f"[SUCCESS] Successfully created {output_zip}")

if __name__ == "__main__":
    create_eb_bundle()
