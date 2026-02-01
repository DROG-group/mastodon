# frozen_string_literal: true

class CreateGamepatchImportLogs < ActiveRecord::Migration[7.0]
  def change
    create_table :gamepatch_import_logs do |t|
      t.string :import_type, null: false
      t.string :source_name
      t.string :mode, default: 'fast'
      t.integer :total_records, default: 0
      t.integer :success_count, default: 0
      t.integer :error_count, default: 0
      t.jsonb :errors, default: []
      t.string :status, default: 'pending'
      t.references :initiated_by_account, foreign_key: { to_table: :accounts }
      t.datetime :started_at
      t.datetime :completed_at
      t.timestamps
    end

    add_index :gamepatch_import_logs, :status
    add_index :gamepatch_import_logs, :created_at
  end
end
