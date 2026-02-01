# frozen_string_literal: true

module Admin
  module Gamepatch
    class ConfigController < BaseController
      def show
        authorize :gamepatch, :show?

        @config = load_config
      end

      def update
        authorize :gamepatch, :update?

        config = load_config

        config_params.each do |key, value|
          config[key.to_s] = value
        end

        save_config(config)

        redirect_to admin_gamepatch_config_path, notice: t('generic.changes_saved_msg')
      end

      private

      def config_params
        params.permit(
          :domain,
          :default_import_mode,
          :scenario_backup_dir,
          :max_import_records,
          :track_impressions,
          :anonymous_responses
        )
      end

      def load_config
        result = ActiveRecord::Base.connection.execute(
          'SELECT key, value FROM gamepatch.config'
        ).to_a.to_h { |row| [row['key'], row['value']] }

        default_config.merge(result)
      rescue ActiveRecord::StatementInvalid
        default_config
      end

      def save_config(config)
        config.each do |key, value|
          sql = <<~SQL.squish
            INSERT INTO gamepatch.config (key, value) VALUES (?, ?)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
          SQL

          ActiveRecord::Base.connection.execute(
            ActiveRecord::Base.sanitize_sql_array([
              sql,
              key.to_s,
              value.to_s,
            ])
          )
        end
      rescue ActiveRecord::StatementInvalid => e
        Rails.logger.warn "Could not save config: #{e.message}"
      end

      def default_config
        {
          'domain' => ENV.fetch('LOCAL_DOMAIN', 'localhost:3000'),
          'default_import_mode' => 'fast',
          'scenario_backup_dir' => Rails.root.join('tmp', 'gamepatch_scenarios').to_s,
          'max_import_records' => '10000',
          'track_impressions' => 'true',
          'anonymous_responses' => 'false',
        }
      end
    end
  end
end
