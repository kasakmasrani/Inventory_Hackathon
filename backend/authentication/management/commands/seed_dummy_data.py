import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from authentication.models import OTP
from operations.models import (
    Adjustment,
    DeliveryItem,
    DeliveryOrder,
    Receipt,
    ReceiptItem,
    StockAlert,
    StockLedger,
    Transfer,
)
from products.models import Product, ProductCategory
from warehouses.models import StockByLocation, Warehouse, WarehouseLocation


class Command(BaseCommand):
    help = "Seed project tables with dummy data (20-30 rows recommended)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=25,
            help="Rows to create per table (recommended: 20 to 30). Default: 25",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        target_count = max(20, min(30, options["count"]))
        if target_count != options["count"]:
            self.stdout.write(self.style.WARNING(f"Count clamped to {target_count} (allowed range: 20-30)."))

        User = get_user_model()
        random.seed(42)

        self.stdout.write("Seeding users...")
        users = []
        for i in range(1, target_count + 1):
            email = f"user{i:03d}@coreinventory.local"
            username = f"user{i:03d}"
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": username,
                    "first_name": f"First{i}",
                    "last_name": f"Last{i}",
                    "role": "manager" if i % 5 == 0 else "staff",
                    "phone": f"+9100000{i:04d}",
                    "is_active": True,
                },
            )
            if created:
                user.set_password("Pass@12345")
                user.save(update_fields=["password"])
            users.append(user)

        self.stdout.write("Seeding OTP entries...")
        for i in range(target_count):
            user = users[i % len(users)]
            otp_code = f"{(100000 + i) % 1000000:06d}"
            OTP.objects.create(
                user=user,
                code=otp_code,
                is_used=(i % 3 == 0),
            )

        self.stdout.write("Seeding product categories...")
        categories = []
        for i in range(1, target_count + 1):
            category, _ = ProductCategory.objects.get_or_create(
                name=f"Category {i:03d}",
                defaults={"description": f"Demo category {i:03d}"},
            )
            categories.append(category)

        self.stdout.write("Seeding products...")
        units = [choice[0] for choice in Product.UNIT_CHOICES]
        products = []
        for i in range(1, target_count + 1):
            product, _ = Product.objects.get_or_create(
                sku_code=f"SKU{i:04d}",
                defaults={
                    "product_name": f"Sample Product {i:03d}",
                    "category": categories[(i - 1) % len(categories)],
                    "unit_of_measure": units[i % len(units)],
                    "initial_stock": random.randint(10, 200),
                    "reorder_level": random.randint(5, 30),
                    "description": f"Auto-generated product {i:03d}",
                },
            )
            products.append(product)

        self.stdout.write("Seeding warehouses...")
        warehouses = []
        for i in range(1, target_count + 1):
            warehouse, _ = Warehouse.objects.get_or_create(
                name=f"Warehouse {i:03d}",
                defaults={
                    "address": f"{100 + i} Demo Street, City {i}",
                    "is_active": True,
                },
            )
            warehouses.append(warehouse)

        self.stdout.write("Seeding warehouse locations...")
        locations = []
        for i in range(1, target_count + 1):
            warehouse = warehouses[(i - 1) % len(warehouses)]
            location, _ = WarehouseLocation.objects.get_or_create(
                warehouse=warehouse,
                name=f"LOC-{i:03d}",
                defaults={"description": f"Location {i:03d} in {warehouse.name}"},
            )
            locations.append(location)

        self.stdout.write("Seeding stock by location...")
        used_pairs = set()
        created_stock_rows = 0
        attempts = 0
        max_attempts = target_count * 20
        while created_stock_rows < target_count and attempts < max_attempts:
            attempts += 1
            product = random.choice(products)
            location = random.choice(locations)
            pair_key = (product.id, location.id)
            if pair_key in used_pairs:
                continue
            used_pairs.add(pair_key)
            StockByLocation.objects.get_or_create(
                product=product,
                location=location,
                defaults={"quantity": random.randint(0, 250)},
            )
            created_stock_rows += 1

        self.stdout.write("Seeding receipts and receipt items...")
        receipts = []
        for i in range(1, target_count + 1):
            receipt, _ = Receipt.objects.get_or_create(
                reference=f"RCPT-{i:05d}",
                defaults={
                    "supplier": f"Supplier {i:03d}",
                    "status": random.choice(["draft", "waiting", "ready", "done"]),
                    "location": random.choice(locations),
                    "notes": "Auto-generated receipt",
                    "created_by": random.choice(users),
                },
            )
            receipts.append(receipt)

        for i in range(target_count):
            ReceiptItem.objects.create(
                receipt=receipts[i % len(receipts)],
                product=random.choice(products),
                quantity=random.randint(1, 40),
            )

        self.stdout.write("Seeding deliveries and delivery items...")
        deliveries = []
        for i in range(1, target_count + 1):
            delivery, _ = DeliveryOrder.objects.get_or_create(
                reference=f"DLV-{i:05d}",
                defaults={
                    "customer": f"Customer {i:03d}",
                    "status": random.choice(["draft", "picking", "packing", "ready", "done"]),
                    "location": random.choice(locations),
                    "notes": "Auto-generated delivery order",
                    "created_by": random.choice(users),
                },
            )
            deliveries.append(delivery)

        for i in range(target_count):
            DeliveryItem.objects.create(
                delivery=deliveries[i % len(deliveries)],
                product=random.choice(products),
                quantity=random.randint(1, 30),
            )

        self.stdout.write("Seeding transfers...")
        for i in range(1, target_count + 1):
            from_location = random.choice(locations)
            to_location = random.choice(locations)
            while to_location.id == from_location.id:
                to_location = random.choice(locations)

            Transfer.objects.get_or_create(
                reference=f"TRF-{i:05d}",
                defaults={
                    "product": random.choice(products),
                    "from_location": from_location,
                    "to_location": to_location,
                    "quantity": random.randint(1, 25),
                    "status": random.choice(["draft", "in_transit", "done"]),
                    "notes": "Auto-generated transfer",
                    "created_by": random.choice(users),
                },
            )

        self.stdout.write("Seeding adjustments...")
        reasons = [choice[0] for choice in Adjustment.REASON_CHOICES]
        for i in range(1, target_count + 1):
            system_qty = random.randint(0, 120)
            counted_qty = max(0, system_qty + random.randint(-10, 10))
            diff = counted_qty - system_qty
            Adjustment.objects.get_or_create(
                reference=f"ADJ-{i:05d}",
                defaults={
                    "product": random.choice(products),
                    "location": random.choice(locations),
                    "system_quantity": system_qty,
                    "counted_quantity": counted_qty,
                    "difference": diff,
                    "reason": random.choice(reasons),
                    "notes": "Auto-generated stock adjustment",
                    "created_by": random.choice(users),
                },
            )

        self.stdout.write("Seeding stock ledger...")
        ledger_ops = [choice[0] for choice in StockLedger.OPERATION_CHOICES]
        for i in range(target_count):
            StockLedger.objects.create(
                product=random.choice(products),
                operation_type=random.choice(ledger_ops),
                quantity_change=random.randint(-20, 25),
                location=random.choice(locations),
                reference=f"LED-{timezone.now().strftime('%Y%m%d')}-{i:04d}",
                notes="Auto-generated ledger entry",
                created_by=random.choice(users),
                timestamp=timezone.now() - timedelta(days=random.randint(0, 30)),
            )

        self.stdout.write("Seeding stock alerts...")
        for i in range(target_count):
            product = random.choice(products)
            reorder_level = product.reorder_level
            current_stock = random.randint(0, max(1, reorder_level + 5))
            StockAlert.objects.create(
                product=product,
                location=random.choice(locations),
                current_stock=current_stock,
                reorder_level=reorder_level,
                is_resolved=(i % 4 == 0),
            )

        self.stdout.write(self.style.SUCCESS(f"Dummy data seeded successfully with target count {target_count}."))
