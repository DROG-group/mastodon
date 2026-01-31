# frozen_string_literal: true

module Admin
  module Gamepatch
    class ScenariosController < BaseController
      def index
        authorize :gamepatch, :index?

        @scenarios = ::Gamepatch::Scenario.list
      end

      def create
        authorize :gamepatch, :create?

        name = params[:name]

        unless name.present?
          redirect_to admin_gamepatch_scenarios_path, alert: t('admin.gamepatch.scenarios.name_required')
          return
        end

        begin
          ::Gamepatch::Scenario.save(name)
          redirect_to admin_gamepatch_scenarios_path, notice: t('admin.gamepatch.scenarios.saved', name: name)
        rescue StandardError => e
          redirect_to admin_gamepatch_scenarios_path, alert: e.message
        end
      end

      def load
        authorize :gamepatch, :update?

        name = params[:id]

        begin
          ::Gamepatch::Scenario.load(name)
          redirect_to admin_gamepatch_scenarios_path, notice: t('admin.gamepatch.scenarios.loaded', name: name)
        rescue StandardError => e
          redirect_to admin_gamepatch_scenarios_path, alert: e.message
        end
      end

      def destroy
        authorize :gamepatch, :destroy?

        name = params[:id]

        begin
          deleted_count = ::Gamepatch::Scenario.delete(name)
          redirect_to admin_gamepatch_scenarios_path, notice: t('admin.gamepatch.scenarios.deleted', count: deleted_count)
        rescue StandardError => e
          redirect_to admin_gamepatch_scenarios_path, alert: e.message
        end
      end
    end
  end
end
