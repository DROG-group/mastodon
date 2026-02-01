# frozen_string_literal: true

class AddBotframeworkFieldsToBotConversations < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    add_column :gamepatch_bot_conversations, :channel, :string unless column_exists?(:gamepatch_bot_conversations, :channel)
    unless column_exists?(:gamepatch_bot_conversations, :external_user_id)
      add_column :gamepatch_bot_conversations, :external_user_id, :string
    end
    unless column_exists?(:gamepatch_bot_conversations, :external_conversation_id)
      add_column :gamepatch_bot_conversations, :external_conversation_id, :string
    end
    unless column_exists?(:gamepatch_bot_conversations, :conversation_reference)
      add_column :gamepatch_bot_conversations, :conversation_reference, :jsonb, default: {}, null: false
    end

    unless index_exists?(:gamepatch_bot_conversations, [:bot_id, :channel, :external_conversation_id],
                         name: 'idx_bot_conversations_external_thread')
      add_index :gamepatch_bot_conversations, [:bot_id, :channel, :external_conversation_id],
                name: 'idx_bot_conversations_external_thread',
                algorithm: :concurrently
    end

    unless index_exists?(:gamepatch_bot_conversations, [:bot_id, :channel, :external_user_id],
                         name: 'idx_bot_conversations_external_user')
      add_index :gamepatch_bot_conversations, [:bot_id, :channel, :external_user_id],
                name: 'idx_bot_conversations_external_user',
                algorithm: :concurrently
    end
  end

  def down
    if index_exists?(:gamepatch_bot_conversations, [:bot_id, :channel, :external_conversation_id],
                     name: 'idx_bot_conversations_external_thread')
      remove_index :gamepatch_bot_conversations, name: 'idx_bot_conversations_external_thread'
    end
    if index_exists?(:gamepatch_bot_conversations, [:bot_id, :channel, :external_user_id],
                     name: 'idx_bot_conversations_external_user')
      remove_index :gamepatch_bot_conversations, name: 'idx_bot_conversations_external_user'
    end

    remove_column :gamepatch_bot_conversations, :conversation_reference if column_exists?(:gamepatch_bot_conversations, :conversation_reference)
    remove_column :gamepatch_bot_conversations, :external_conversation_id if column_exists?(:gamepatch_bot_conversations, :external_conversation_id)
    remove_column :gamepatch_bot_conversations, :external_user_id if column_exists?(:gamepatch_bot_conversations, :external_user_id)
    remove_column :gamepatch_bot_conversations, :channel if column_exists?(:gamepatch_bot_conversations, :channel)
  end
end
