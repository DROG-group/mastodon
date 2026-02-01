# frozen_string_literal: true

module Admin
  module Gamepatch
    class DashboardController < BaseController
      def index
        authorize :gamepatch, :index?

        @stats = {
          total_cards: ::Gamepatch::CardDefinition.count,
          total_instances: ::Gamepatch::CardInstance.count,
          total_responses: ::Gamepatch::CardResponse.count,
          active_bots: ::Gamepatch::Bot.active.count,
          active_api_keys: ::Gamepatch::ApiKey.active.count,
          recent_imports: ::Gamepatch::ImportLog.recent.limit(5),
        }

        @recent_cards = ::Gamepatch::CardDefinition.order(created_at: :desc).limit(10)
        recent_ids = @recent_cards.map(&:id)
        @instance_counts = if recent_ids.any?
          ::Gamepatch::CardInstance.where(card_definition_id: recent_ids).group(:card_definition_id).count
        else
          {}
        end
        @schema_distribution = ::Gamepatch::CardDefinition.group(:schema_version).count
      end
    end
  end
end
