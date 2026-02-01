# frozen_string_literal: true

class CreateGamepatchApiKeys < ActiveRecord::Migration[7.0]
  def change
    create_table :gamepatch_api_keys do |t|
      t.string :name, null: false
      t.string :token_digest, null: false
      t.string :prefix, null: false, limit: 8
      t.string :scopes, array: true, default: []
      t.references :created_by_account, foreign_key: { to_table: :accounts }
      t.datetime :last_used_at
      t.datetime :revoked_at
      t.timestamps
    end

    add_index :gamepatch_api_keys, :prefix, unique: true
    add_index :gamepatch_api_keys, :revoked_at
  end
end
