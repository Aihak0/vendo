#!/usr/bin/env python3
import os

base_dir = "backend/src"
files_to_replace = [
    ("mesin/mesin.service", "mesin"),
    ("transaksi/transaksi.service", "transaksi"),
    ("pergerakan_stock/pergerakan_stock.service", "pergerakan_stock"),
    ("task/task.service", "task"),
]

for old_name, service_name in files_to_replace:
    original_file = os.path.join(base_dir, f"{old_name}.ts")
    new_file = os.path.join(base_dir, f"{old_name}.new.ts")
    
    if os.path.exists(new_file):
        try:
            with open(new_file, 'r') as f:
                content = f.read()
            
            with open(original_file, 'w') as f:
                f.write(content)
            
            os.remove(new_file)
            print(f"✓ Replaced {service_name}.service.ts")
        except Exception as e:
            print(f"✗ Error replacing {service_name}.service.ts: {e}")
    else:
        print(f"⚠ {service_name}.service.new.ts not found")

print("\n✓ All files have been replaced")
