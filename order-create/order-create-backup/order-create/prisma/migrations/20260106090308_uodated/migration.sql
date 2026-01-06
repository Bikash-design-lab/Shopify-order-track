-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL DEFAULT 'testfeatures-4623.myshopify.com',
    "orderGid" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_OrderRecord" ("createdAt", "id", "orderGid", "shop") SELECT "createdAt", "id", "orderGid", "shop" FROM "OrderRecord";
DROP TABLE "OrderRecord";
ALTER TABLE "new_OrderRecord" RENAME TO "OrderRecord";
CREATE UNIQUE INDEX "OrderRecord_orderGid_key" ON "OrderRecord"("orderGid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
