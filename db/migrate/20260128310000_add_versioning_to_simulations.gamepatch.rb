class AddVersioningToSimulations < ActiveRecord::Migration[7.1]
  def change
    safety_assured do
      add_column :gamepatch_simulations, :versions, :jsonb, default: []
    end
  end
end
