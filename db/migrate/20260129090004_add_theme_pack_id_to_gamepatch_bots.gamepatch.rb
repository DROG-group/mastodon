# frozen_string_literal: true

class AddThemePackIdToGamepatchBots < ActiveRecord::Migration[7.0]
  def change
    safety_assured do
      add_reference :gamepatch_bots, :theme_pack, foreign_key: { to_table: :gamepatch_theme_packs }
    end
  end
end
