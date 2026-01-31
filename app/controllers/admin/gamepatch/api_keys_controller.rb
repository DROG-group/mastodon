# frozen_string_literal: true

module Admin
  module Gamepatch
    class ApiKeysController < BaseController
      def index
        authorize :gamepatch, :index?

        @api_keys = ::Gamepatch::ApiKey.order(created_at: :desc)
      end

      def create
        authorize :gamepatch, :create?

        name = params[:name]
        scopes = Array(params[:scopes]).reject(&:blank?)

        unless name.present?
          redirect_to admin_gamepatch_api_keys_path, alert: t('admin.gamepatch.api_keys.name_required')
          return
        end

        if scopes.empty?
          redirect_to admin_gamepatch_api_keys_path, alert: t('admin.gamepatch.api_keys.scopes_required')
          return
        end

        begin
          api_key, raw_token = ::Gamepatch::ApiKey.generate(
            name: name,
            scopes: scopes,
            created_by: current_account
          )

          flash[:new_token] = raw_token
          redirect_to admin_gamepatch_api_keys_path, notice: t('admin.gamepatch.api_keys.created', name: name)
        rescue StandardError => e
          redirect_to admin_gamepatch_api_keys_path, alert: e.message
        end
      end

      def destroy
        authorize :gamepatch, :destroy?

        api_key = ::Gamepatch::ApiKey.find(params[:id])

        if api_key.revoked?
          redirect_to admin_gamepatch_api_keys_path, alert: t('admin.gamepatch.api_keys.already_revoked')
          return
        end

        api_key.revoke!

        redirect_to admin_gamepatch_api_keys_path, notice: t('admin.gamepatch.api_keys.revoked', name: api_key.name)
      rescue ActiveRecord::RecordNotFound
        redirect_to admin_gamepatch_api_keys_path, alert: t('admin.gamepatch.api_keys.not_found')
      end
    end
  end
end
