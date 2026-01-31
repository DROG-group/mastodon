# frozen_string_literal: true

module Admin
  module Gamepatch
    class AnalyticsController < BaseController
      def index
        authorize :gamepatch, :index?

        @overview = ::Gamepatch::AnalyticsService.overview(date_range)
        @daily_responses = ::Gamepatch::AnalyticsService.daily_responses(date_range)
        @widget_type_distribution = ::Gamepatch::Widget.group(:widget_type).count
      end

      def widgets
        authorize :gamepatch, :index?

        @widgets = ::Gamepatch::Widget.includes(:responses)
                                      .order(responses_count: :desc)
                                      .limit(100)

        @widgets = @widgets.where(widget_type: params[:widget_type]) if params[:widget_type].present?

        @widget_stats = @widgets.map do |widget|
          impressions = ::Gamepatch::WidgetImpression.where(widget: widget, created_at: date_range).count
          responses = widget.responses.where(created_at: date_range).count
          {
            widget: widget,
            impressions: impressions,
            responses: responses,
            response_rate: impressions > 0 ? (responses.to_f / impressions * 100).round(1) : 0
          }
        end
      end

      def dialogues
        authorize :gamepatch, :index?

        @dialogue_ids = ::Gamepatch::Widget.where.not(dialogue_id: nil)
                                           .distinct
                                           .pluck(:dialogue_id)

        @dialogue_funnels = @dialogue_ids.map do |dialogue_id|
          ::Gamepatch::AnalyticsService.dialogue_funnel(dialogue_id, date_range)
        end.compact
      end

      def responses
        authorize :gamepatch, :index?

        @widget_type = params[:widget_type]

        @aggregations = if @widget_type.present?
                          ::Gamepatch::AnalyticsService.response_aggregations(
                            date_range: date_range,
                            widget_type: @widget_type
                          )
                        else
                          {}
                        end
      end

      def export
        authorize :gamepatch, :index?

        format = params[:format] || 'csv'

        data = case params[:export_type]
               when 'widgets' then export_widgets
               when 'responses' then export_responses
               when 'impressions' then export_impressions
               else
                 redirect_to admin_gamepatch_analytics_path, alert: t('admin.gamepatch.analytics.invalid_export')
                 return
               end

        case format
        when 'csv'
          send_data data[:csv], filename: "#{params[:export_type]}_#{Date.current}.csv", type: 'text/csv'
        when 'json'
          send_data data[:json], filename: "#{params[:export_type]}_#{Date.current}.json", type: 'application/json'
        end
      end

      private

      def date_range
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : 30.days.ago.to_date
        end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.current
        start_date.beginning_of_day..end_date.end_of_day
      rescue ArgumentError
        30.days.ago.beginning_of_day..Time.current
      end

      def export_widgets
        widgets = ::Gamepatch::Widget.where(created_at: date_range).includes(:responses)

        csv = CSV.generate do |csv|
          csv << %w[uid type prompt options_count responses_count created_at]
          widgets.each do |w|
            csv << [w.uid, w.widget_type, w.prompt, w.options.size, w.responses_count, w.created_at.iso8601]
          end
        end

        json = widgets.map do |w|
          {
            uid: w.uid,
            type: w.widget_type,
            prompt: w.prompt,
            options: w.options,
            responses_count: w.responses_count,
            created_at: w.created_at.iso8601
          }
        end.to_json

        { csv: csv, json: json }
      end

      def export_responses
        responses = ::Gamepatch::WidgetResponse.where(created_at: date_range)
                                               .includes(:widget, :account)

        csv = CSV.generate do |csv|
          csv << %w[widget_uid widget_type choice_text account_username created_at]
          responses.each do |r|
            csv << [r.widget.uid, r.widget.widget_type, r.choice_text, r.account&.username, r.created_at.iso8601]
          end
        end

        json = responses.map do |r|
          {
            widget_uid: r.widget.uid,
            widget_type: r.widget.widget_type,
            choices: r.choices,
            choice_text: r.choice_text,
            account_username: r.account&.username,
            created_at: r.created_at.iso8601
          }
        end.to_json

        { csv: csv, json: json }
      end

      def export_impressions
        impressions = ::Gamepatch::WidgetImpression.where(created_at: date_range)
                                                   .includes(:widget, :account)

        csv = CSV.generate do |csv|
          csv << %w[widget_uid account_username session_id referrer created_at]
          impressions.each do |i|
            csv << [i.widget.uid, i.account&.username, i.session_id, i.referrer, i.created_at.iso8601]
          end
        end

        json = impressions.map do |i|
          {
            widget_uid: i.widget.uid,
            account_username: i.account&.username,
            session_id: i.session_id,
            referrer: i.referrer,
            created_at: i.created_at.iso8601
          }
        end.to_json

        { csv: csv, json: json }
      end
    end
  end
end
