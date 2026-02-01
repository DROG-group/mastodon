# frozen_string_literal: true

class CreateGamepatchCardResponses < ActiveRecord::Migration[7.0]
  def change
    create_table :gamepatch_card_responses do |t|
      t.references :card_instance, null: false, foreign_key: { to_table: :gamepatch_card_instances }
      t.references :account, null: false, foreign_key: true
      t.jsonb :response_payload, null: false, default: {}
      t.jsonb :action, null: false, default: {}
      t.jsonb :inputs, null: false, default: {}
      t.jsonb :context, null: false, default: {}
      t.timestamps
    end

  end
end
