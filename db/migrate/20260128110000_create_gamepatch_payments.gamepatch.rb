# frozen_string_literal: true

class CreateGamepatchPayments < ActiveRecord::Migration[7.0]
  def change
    create_table :gamepatch_subscriptions do |t|
      t.references :account, null: false, foreign_key: true
      t.string :mollie_customer_id
      t.string :mollie_subscription_id
      t.string :tier, null: false
      t.string :status, default: 'pending'
      t.decimal :amount, precision: 8, scale: 2
      t.string :currency, default: 'EUR'
      t.datetime :current_period_start
      t.datetime :current_period_end
      t.datetime :cancelled_at
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :gamepatch_subscriptions, :mollie_subscription_id, unique: true
    add_index :gamepatch_subscriptions, [:account_id, :status]
    add_index :gamepatch_subscriptions, :tier
    add_index :gamepatch_subscriptions, :status

    create_table :gamepatch_payments do |t|
      t.references :account, foreign_key: true
      t.references :subscription, foreign_key: { to_table: :gamepatch_subscriptions }
      t.string :mollie_payment_id, null: false
      t.string :status, default: 'open'
      t.decimal :amount, precision: 8, scale: 2
      t.string :currency, default: 'EUR'
      t.string :payment_method
      t.string :description
      t.jsonb :metadata, default: {}
      t.datetime :paid_at
      t.timestamps
    end

    add_index :gamepatch_payments, :mollie_payment_id, unique: true
    add_index :gamepatch_payments, :status
    add_index :gamepatch_payments, :payment_method
  end
end
