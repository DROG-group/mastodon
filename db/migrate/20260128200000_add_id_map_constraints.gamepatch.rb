class AddIdMapConstraints < ActiveRecord::Migration[7.1]
  def up
    # Ensure foreign key constraints on id_map where possible
    # Note: entity_id in id_map refers to statuses.id or accounts.id
    
    safety_assured do
      execute <<-'SQL'
        CREATE SCHEMA IF NOT EXISTS gamepatch;

        CREATE TABLE IF NOT EXISTS gamepatch.id_map (
          external_id BIGINT NOT NULL,
          mastodon_id BIGINT NOT NULL,
          account_id BIGINT,
          entity_type TEXT NOT NULL DEFAULT 'status',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          PRIMARY KEY (external_id, entity_type)
        );
        CREATE INDEX IF NOT EXISTS idx_id_map_mastodon ON gamepatch.id_map(mastodon_id);

        -- Add trigger to cleanup id_map when statuses are deleted
        CREATE OR REPLACE FUNCTION gamepatch.cleanup_id_map_on_status_delete()
        RETURNS TRIGGER AS $$
        BEGIN
          DELETE FROM gamepatch.id_map WHERE mastodon_id = OLD.id AND entity_type = 'status';
          RETURN OLD;
        END; $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_cleanup_id_map_status ON statuses;
        CREATE TRIGGER trg_cleanup_id_map_status
        AFTER DELETE ON statuses
        FOR EACH ROW EXECUTE FUNCTION gamepatch.cleanup_id_map_on_status_delete();

        -- Add trigger to cleanup id_map when accounts are deleted
        CREATE OR REPLACE FUNCTION gamepatch.cleanup_id_map_on_account_delete()
        RETURNS TRIGGER AS $$
        BEGIN
          DELETE FROM gamepatch.id_map WHERE account_id = OLD.id;
          DELETE FROM gamepatch.id_map WHERE mastodon_id = OLD.id AND entity_type = 'account';
          RETURN OLD;
        END; $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_cleanup_id_map_account ON accounts;
        CREATE TRIGGER trg_cleanup_id_map_account
        AFTER DELETE ON accounts
        FOR EACH ROW EXECUTE FUNCTION gamepatch.cleanup_id_map_on_account_delete();

        -- Ensure indices for performance
        CREATE INDEX IF NOT EXISTS idx_id_map_account_id ON gamepatch.id_map(account_id);
      SQL
    end
  end

  def down
    safety_assured do
      execute <<-'SQL'
        DROP TRIGGER IF EXISTS trg_cleanup_id_map_status ON statuses;
        DROP TRIGGER IF EXISTS trg_cleanup_id_map_account ON accounts;
        DROP FUNCTION IF EXISTS gamepatch.cleanup_id_map_on_status_delete();
        DROP FUNCTION IF EXISTS gamepatch.cleanup_id_map_on_account_delete();
        DROP INDEX IF EXISTS gamepatch.idx_id_map_account_id;
      SQL
    end
  end
end
