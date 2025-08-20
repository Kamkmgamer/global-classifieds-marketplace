import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndexes1703000000000 implements MigrationInterface {
  name = 'AddSearchIndexes1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pg_trgm extension for trigram similarity search
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    
    // Enable btree_gin extension for composite GIN indexes
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gin;`);

    // Add full-text search column with tsvector
    await queryRunner.query(`
      ALTER TABLE "listing" 
      ADD COLUMN "search_vector" tsvector 
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(location, '')), 'C')
      ) STORED;
    `);

    // Create GIN index for full-text search
    await queryRunner.query(`
      CREATE INDEX "IDX_listing_search_vector" 
      ON "listing" USING GIN ("search_vector");
    `);

    // Create trigram indexes for fuzzy search
    await queryRunner.query(`
      CREATE INDEX "IDX_listing_title_trgm" 
      ON "listing" USING GIN ("title" gin_trgm_ops);
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_listing_description_trgm" 
      ON "listing" USING GIN ("description" gin_trgm_ops);
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_listing_location_trgm" 
      ON "listing" USING GIN ("location" gin_trgm_ops);
    `);

    // Create composite GIN index for filtering + search
    await queryRunner.query(`
      CREATE INDEX "IDX_listing_composite_search" 
      ON "listing" USING GIN ("price", "location", "search_vector");
    `);

    // Create B-tree indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "IDX_listing_price_created" 
      ON "listing" ("price", "createdAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_listing_location_price" 
      ON "listing" ("location", "price");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_listing_created_price" 
      ON "listing" ("createdAt" DESC, "price");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_created_price";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_location_price";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_price_created";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_composite_search";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_location_trgm";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_description_trgm";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_title_trgm";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listing_search_vector";`);

    // Drop search vector column
    await queryRunner.query(`ALTER TABLE "listing" DROP COLUMN IF EXISTS "search_vector";`);
  }
}
