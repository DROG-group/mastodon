# frozen_string_literal: true

class CreateGamepatchScenarios < ActiveRecord::Migration[7.0]
  def up
    unless table_exists?(:gamepatch_scenario_definitions)
      create_table :gamepatch_scenario_definitions do |t|
        t.string :uid, null: false
        t.string :name, null: false
        t.string :version, null: false, default: '1.0'
        t.text :description
        t.string :entry_card_uid
        t.jsonb :definition, default: {}, null: false
        t.jsonb :metadata, default: {}, null: false
        t.boolean :active, default: true, null: false
        t.timestamps
      end
    end

    add_index :gamepatch_scenario_definitions, :uid, unique: true, if_not_exists: true
    add_index :gamepatch_scenario_definitions, :active, if_not_exists: true

    unless table_exists?(:gamepatch_scenario_runs)
      create_table :gamepatch_scenario_runs do |t|
        t.references :scenario_definition, null: false, foreign_key: { to_table: :gamepatch_scenario_definitions }
        t.references :user_account, null: false, foreign_key: { to_table: :accounts }
        t.references :bot, foreign_key: { to_table: :gamepatch_bots }
        t.references :card_instance, foreign_key: { to_table: :gamepatch_card_instances }
        t.string :status, null: false, default: 'active'
        t.string :current_card_uid
        t.jsonb :context, default: {}, null: false
        t.datetime :started_at
        t.datetime :completed_at
        t.timestamps
      end
    end

    add_index :gamepatch_scenario_runs, :status, if_not_exists: true
    add_index :gamepatch_scenario_runs, [:scenario_definition_id, :user_account_id],
              name: 'idx_scenario_runs_definition_account',
              if_not_exists: true

    unless table_exists?(:gamepatch_scenario_states)
      create_table :gamepatch_scenario_states do |t|
        t.references :scenario_run, null: false, foreign_key: { to_table: :gamepatch_scenario_runs }
        t.jsonb :memory, default: {}, null: false
        t.jsonb :variables, default: {}, null: false
        t.jsonb :history, default: [], null: false
        t.timestamps
      end
    end

    add_index :gamepatch_scenario_states, :scenario_run_id, unique: true, if_not_exists: true

    unless table_exists?(:gamepatch_inventories)
      create_table :gamepatch_inventories do |t|
        t.references :scenario_run, null: false, foreign_key: { to_table: :gamepatch_scenario_runs }
        t.jsonb :items, default: {}, null: false
        t.jsonb :currency, default: {}, null: false
        t.timestamps
      end
    end

    add_index :gamepatch_inventories, :scenario_run_id, unique: true, if_not_exists: true

    unless table_exists?(:gamepatch_quest_flags)
      create_table :gamepatch_quest_flags do |t|
        t.references :scenario_run, null: false, foreign_key: { to_table: :gamepatch_scenario_runs }
        t.jsonb :flags, default: {}, null: false
        t.jsonb :milestones, default: {}, null: false
        t.timestamps
      end
    end

    add_index :gamepatch_quest_flags, :scenario_run_id, unique: true, if_not_exists: true

    unless table_exists?(:gamepatch_npc_profiles)
      create_table :gamepatch_npc_profiles do |t|
        t.references :scenario_definition, null: false, foreign_key: { to_table: :gamepatch_scenario_definitions }
        t.string :name, null: false
        t.string :role
        t.text :description
        t.jsonb :data, default: {}, null: false
        t.jsonb :metadata, default: {}, null: false
        t.timestamps
      end
    end

    add_index :gamepatch_npc_profiles, :name, if_not_exists: true
  end

  def down
    drop_table :gamepatch_npc_profiles if table_exists?(:gamepatch_npc_profiles)
    drop_table :gamepatch_quest_flags if table_exists?(:gamepatch_quest_flags)
    drop_table :gamepatch_inventories if table_exists?(:gamepatch_inventories)
    drop_table :gamepatch_scenario_states if table_exists?(:gamepatch_scenario_states)
    drop_table :gamepatch_scenario_runs if table_exists?(:gamepatch_scenario_runs)
    drop_table :gamepatch_scenario_definitions if table_exists?(:gamepatch_scenario_definitions)
  end
end
