# frozen_string_literal: true

class CreateGamepatchThemePacks < ActiveRecord::Migration[7.0]
  def change
    create_table :gamepatch_theme_packs do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.jsonb :tokens, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    add_index :gamepatch_theme_packs, :slug, unique: true
    add_index :gamepatch_theme_packs, :active

    reversible do |dir|
      dir.up do
        now = Time.current.strftime('%Y-%m-%d %H:%M:%S')
        safety_assured do
          execute <<~SQL
            INSERT INTO gamepatch_theme_packs (name, slug, tokens, metadata, active, created_at, updated_at)
            VALUES ('Default', 'default', '{}'::jsonb, '{}'::jsonb, true, '#{now}', '#{now}')
          SQL
        end
      end
    end
  end
end
