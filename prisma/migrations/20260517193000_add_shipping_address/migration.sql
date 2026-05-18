ALTER TABLE "orders"
ADD COLUMN "shipping_street" TEXT NOT NULL DEFAULT '',
ADD COLUMN "shipping_city" TEXT NOT NULL DEFAULT '',
ADD COLUMN "shipping_department" TEXT NOT NULL DEFAULT '',
ADD COLUMN "shipping_zip" TEXT;

