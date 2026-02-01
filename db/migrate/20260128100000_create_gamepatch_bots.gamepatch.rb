# frozen_string_literal: true

class CreateGamepatchBots < ActiveRecord::Migration[7.0]
  def change
    create_table :gamepatch_bots do |t|
      t.string :name, null: false
      t.string :bot_type, null: false, default: 'greeter'
      t.references :account, null: false, foreign_key: true
      t.text :description
      t.jsonb :config, default: {}
      t.boolean :active, default: true
      t.timestamps
    end

    add_index :gamepatch_bots, :name, unique: true
    add_index :gamepatch_bots, :bot_type
    add_index :gamepatch_bots, :active

    create_table :gamepatch_bot_conversations do |t|
      t.references :bot, null: false, foreign_key: { to_table: :gamepatch_bots }
      t.references :user_account, null: false, foreign_key: { to_table: :accounts }
      t.references :handed_off_to, foreign_key: { to_table: :gamepatch_bots }
      t.string :status, default: 'active'
      t.jsonb :context, default: {}
      t.datetime :completed_at
      t.timestamps
    end

    add_index :gamepatch_bot_conversations, :status
    add_index :gamepatch_bot_conversations, [:user_account_id, :bot_id, :status],
              name: 'idx_bot_conversations_user_bot_status'

    create_table :gamepatch_bot_messages do |t|
      t.references :conversation, null: false, foreign_key: { to_table: :gamepatch_bot_conversations }
      t.string :role, null: false
      t.text :content, null: false
      t.jsonb :metadata, default: {}
      t.datetime :created_at, null: false
    end

    add_index :gamepatch_bot_messages, :role
    add_index :gamepatch_bot_messages, [:conversation_id, :created_at]
  end
end
