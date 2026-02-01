# frozen_string_literal: true

class DropGamepatchWidgets < ActiveRecord::Migration[7.0]
  def up
    safety_assured do
      if foreign_key_exists?(:gamepatch_bot_conversations, :gamepatch_widgets, column: :current_widget_id)
        remove_reference :gamepatch_bot_conversations, :current_widget, foreign_key: { to_table: :gamepatch_widgets }
      elsif column_exists?(:gamepatch_bot_conversations, :current_widget_id)
        remove_column :gamepatch_bot_conversations, :current_widget_id
      end

      drop_table :gamepatch_widget_impressions, if_exists: true
      drop_table :gamepatch_widget_responses, if_exists: true
      drop_table :gamepatch_widgets, if_exists: true
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
