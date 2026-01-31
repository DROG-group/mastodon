# frozen_string_literal: true

module Admin
  module Gamepatch
    class ImportsController < BaseController
      def index
        authorize :gamepatch, :index?

        @import_logs = ::Gamepatch::ImportLog.recent.limit(50)
      end

      def create
        authorize :gamepatch, :create?

        case params[:import_type]
        when 'csv' then import_csv
        when 'sheet' then import_sheet
        when 'dialogue' then import_dialogue
        else
          redirect_to admin_gamepatch_imports_path, alert: t('admin.gamepatch.imports.invalid_type')
        end
      end

      def csv
        authorize :gamepatch, :create?
        import_csv
      end

      def sheet
        authorize :gamepatch, :create?
        import_sheet
      end

      def dialogue
        authorize :gamepatch, :create?
        import_dialogue
      end

      def templates
        authorize :gamepatch, :index?

        respond_to do |format|
          format.html
          format.csv { send_data csv_template, filename: 'gamepatch_import_template.csv' }
          format.yaml { send_data dialogue_template, filename: 'dialogue_template.yaml' }
        end
      end

      private

      def import_csv
        file = params[:file]
        mode = params[:mode] || 'fast'

        unless file
          redirect_to admin_gamepatch_imports_path, alert: t('admin.gamepatch.imports.no_file')
          return
        end

        log = ::Gamepatch::ImportLog.start(
          import_type: 'csv',
          source_name: file.original_filename,
          mode: mode,
          initiated_by: current_account
        )

        begin
          results = ::Gamepatch::Importer.from_csv(file.path, mode: mode.to_sym)
          success_count = results.count { |r| r[:success] }
          error_count = results.count { |r| !r[:success] }
          errors = results.select { |r| !r[:success] }.map { |r| { idx: r[:idx], error: r[:error] } }

          log.complete!(success_count: success_count, error_count: error_count, errors: errors)

          redirect_to admin_gamepatch_imports_path, notice: t('admin.gamepatch.imports.success', success: success_count, errors: error_count)
        rescue StandardError => e
          log.fail!(e)
          redirect_to admin_gamepatch_imports_path, alert: e.message
        end
      end

      def import_sheet
        url = params[:url]
        mode = params[:mode] || 'fast'

        unless url.present?
          redirect_to admin_gamepatch_imports_path, alert: t('admin.gamepatch.imports.no_url')
          return
        end

        log = ::Gamepatch::ImportLog.start(
          import_type: 'sheet',
          source_name: url,
          mode: mode,
          initiated_by: current_account
        )

        begin
          results = ::Gamepatch::Importer.from_sheet_url(url, mode: mode.to_sym)
          success_count = results.count { |r| r[:success] }
          error_count = results.count { |r| !r[:success] }
          errors = results.select { |r| !r[:success] }.map { |r| { idx: r[:idx], error: r[:error] } }

          log.complete!(success_count: success_count, error_count: error_count, errors: errors)

          redirect_to admin_gamepatch_imports_path, notice: t('admin.gamepatch.imports.success', success: success_count, errors: error_count)
        rescue StandardError => e
          log.fail!(e)
          redirect_to admin_gamepatch_imports_path, alert: e.message
        end
      end

      def import_dialogue
        file = params[:file]
        account_id = params[:account_id]

        unless file
          redirect_to admin_gamepatch_imports_path, alert: t('admin.gamepatch.imports.no_file')
          return
        end

        unless account_id.present?
          redirect_to admin_gamepatch_imports_path, alert: t('admin.gamepatch.imports.no_account')
          return
        end

        account = Account.find_by(id: account_id)
        unless account
          redirect_to admin_gamepatch_imports_path, alert: t('admin.gamepatch.imports.account_not_found')
          return
        end

        log = ::Gamepatch::ImportLog.start(
          import_type: 'dialogue',
          source_name: file.original_filename,
          initiated_by: current_account
        )

        begin
          result = ::Gamepatch::DialogueService.import_file(
            account: account,
            file_path: file.path
          )

          widget_count = result[:widgets]&.size || 0
          log.complete!(success_count: widget_count, error_count: 0)

          redirect_to admin_gamepatch_imports_path, notice: t('admin.gamepatch.imports.dialogue_success', count: widget_count)
        rescue StandardError => e
          log.fail!(e)
          redirect_to admin_gamepatch_imports_path, alert: e.message
        end
      end

      def csv_template
        <<~CSV
          user_name,display_name,email,note,text,visibility,media
          alice,Alice Smith,alice@example.com,Hello world,My first post,public,
          bob,Bob Jones,bob@example.com,Developer,Check out this link,unlisted,
        CSV
      end

      def dialogue_template
        <<~YAML
          dialogue:
            - CardNo: 1
              Text: "Welcome! How are you feeling today?"
              Choices:
                - Choice: "Great!"
                  LeadsTo: 2
                - Choice: "Could be better"
                  LeadsTo: 3

            - CardNo: 2
              Text: "Wonderful! Keep up the positive energy!"
              ending: true

            - CardNo: 3
              Text: "I'm sorry to hear that. Is there anything I can help with?"
              Choices:
                - Choice: "Just need to talk"
                  LeadsTo: 4
                - Choice: "I'm okay, thanks"
                  LeadsTo: 2

            - CardNo: 4
              Text: "I'm here for you. Take your time."
              ending: true
        YAML
      end
    end
  end
end
