# frozen_string_literal: true

module Admin
  module Gamepatch
    class DashboardController < BaseController
      def index
        authorize :gamepatch, :index?

        @stats = {
          total_widgets: ::Gamepatch::Widget.count,
          total_responses: ::Gamepatch::WidgetResponse.count,
          total_impressions: ::Gamepatch::WidgetImpression.count,
          active_api_keys: ::Gamepatch::ApiKey.active.count,
          recent_imports: ::Gamepatch::ImportLog.recent.limit(5),
        }

        @recent_widgets = ::Gamepatch::Widget.order(created_at: :desc).limit(10)
        @widget_type_distribution = ::Gamepatch::Widget.group(:widget_type).count
      end
    end
  end
end
