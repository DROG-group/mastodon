# frozen_string_literal: true

class CreateGamepatchCardInstances < ActiveRecord::Migration[7.0]
  def change
    create_table :gamepatch_card_instances do |t|
      t.references :card_definition, null: false, foreign_key: { to_table: :gamepatch_card_definitions }
      t.references :bot, null: false, foreign_key: { to_table: :gamepatch_bots }
      t.jsonb :state, null: false, default: {}
      t.jsonb :context, null: false, default: {}
      t.string :status, null: false, default: 'active'
      t.timestamps
    end

    add_index :gamepatch_card_instances, :status
  end
end
