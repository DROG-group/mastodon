class CreateGamepatchSimulations < ActiveRecord::Migration[7.1]
  def change
    safety_assured do
      create_table :gamepatch_simulations do |t|
        t.string :name, null: false
        t.text :description
        t.text :ruby_code, null: false
        t.string :status, default: 'draft'
        t.datetime :last_run_at
        t.references :created_by_account, foreign_key: { to_table: :accounts }
        t.timestamps
      end

      create_table :gamepatch_simulation_logs do |t|
        t.references :simulation, null: false, foreign_key: { to_table: :gamepatch_simulations }
        t.string :status
        t.jsonb :results
        t.text :error_message
        t.integer :duration_ms
        t.references :run_by_account, foreign_key: { to_table: :accounts }
        t.timestamps
      end

      add_index :gamepatch_simulations, :name, unique: true
    end
  end
end
