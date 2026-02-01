# frozen_string_literal: true

class CreateGamepatchCardDefinitions < ActiveRecord::Migration[7.0]
  def change
    create_table :gamepatch_card_definitions do |t|
      t.string :uid, null: false
      t.string :schema_version, null: false
      t.string :card_version, null: false
      t.jsonb :definition, null: false, default: {}
      t.jsonb :compiled_definition, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :gamepatch_card_definitions, :uid, unique: true
    add_index :gamepatch_card_definitions, :schema_version
  end
end
