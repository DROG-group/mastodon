# frozen_string_literal: true

module Admin
  module Gamepatch
    class PaymentsController < BaseController
      def index
        authorize :gamepatch, :index?

        @overview = {
          total_subscriptions: ::Gamepatch::Subscription.count,
          active_subscriptions: ::Gamepatch::Subscription.active.count,
          pending_subscriptions: ::Gamepatch::Subscription.pending.count,
          cancelled_subscriptions: ::Gamepatch::Subscription.cancelled.count,
          total_payments: ::Gamepatch::Payment.count,
          successful_payments: ::Gamepatch::Payment.paid.count,
          total_revenue: ::Gamepatch::Payment.paid.sum(:amount),
          monthly_revenue: ::Gamepatch::Payment.paid.where(paid_at: 30.days.ago..).sum(:amount),
        }

        @tier_distribution = ::Gamepatch::Subscription.active.group(:tier).count
        @payment_method_distribution = ::Gamepatch::Payment.paid.group(:payment_method).count

        @recent_subscriptions = ::Gamepatch::Subscription.includes(:account)
                                                         .order(created_at: :desc)
                                                         .limit(10)

        @recent_payments = ::Gamepatch::Payment.includes(:account, :subscription)
                                               .order(created_at: :desc)
                                               .limit(10)
      end

      def subscriptions
        authorize :gamepatch, :index?

        @subscriptions = ::Gamepatch::Subscription.includes(:account, :payments)
                                                  .order(created_at: :desc)

        @subscriptions = @subscriptions.where(status: params[:status]) if params[:status].present?
        @subscriptions = @subscriptions.where(tier: params[:tier]) if params[:tier].present?

        @subscriptions = @subscriptions.page(params[:page]).per(25)
      end

      def payments
        authorize :gamepatch, :index?

        @payments = ::Gamepatch::Payment.includes(:account, :subscription)
                                        .order(created_at: :desc)

        @payments = @payments.where(status: params[:status]) if params[:status].present?
        @payments = @payments.where(payment_method: params[:payment_method]) if params[:payment_method].present?

        @payments = @payments.page(params[:page]).per(25)
      end

      def show_subscription
        authorize :gamepatch, :show?

        @subscription = ::Gamepatch::Subscription.includes(:account, :payments).find(params[:id])
      end

      def show_payment
        authorize :gamepatch, :show?

        @payment = ::Gamepatch::Payment.includes(:account, :subscription).find(params[:id])
      end

      def cancel_subscription
        authorize :gamepatch, :update?

        @subscription = ::Gamepatch::Subscription.find(params[:id])

        if ::Gamepatch::MollieService.cancel_subscription(@subscription)
          log_action :update, @subscription
          redirect_to admin_gamepatch_payments_subscription_path(@subscription), notice: t('admin.gamepatch.payments.subscription_cancelled')
        else
          redirect_to admin_gamepatch_payments_subscription_path(@subscription), alert: t('admin.gamepatch.payments.cancel_failed')
        end
      end

      def refund_payment
        authorize :gamepatch, :update?

        @payment = ::Gamepatch::Payment.find(params[:id])

        begin
          # Attempt refund via Mollie
          Mollie::Payment.get(@payment.mollie_payment_id).refund(amount: { value: @payment.amount.to_s, currency: @payment.currency })
          @payment.update!(status: 'refunded')
          log_action :update, @payment
          redirect_to admin_gamepatch_payments_payment_path(@payment), notice: t('admin.gamepatch.payments.refund_success')
        rescue Mollie::Exception => e
          redirect_to admin_gamepatch_payments_payment_path(@payment), alert: "#{t('admin.gamepatch.payments.refund_failed')}: #{e.message}"
        end
      end

      def export
        authorize :gamepatch, :index?

        case params[:export_type]
        when 'subscriptions'
          send_subscriptions_csv
        when 'payments'
          send_payments_csv
        when 'revenue'
          send_revenue_csv
        else
          redirect_to admin_gamepatch_payments_path, alert: t('admin.gamepatch.payments.invalid_export')
        end
      end

      private

      def send_subscriptions_csv
        subscriptions = ::Gamepatch::Subscription.includes(:account).all

        csv = CSV.generate do |csv|
          csv << %w(id account_username tier status amount currency period_start period_end created_at)
          subscriptions.each do |sub|
            csv << [
              sub.id,
              sub.account&.username,
              sub.tier,
              sub.status,
              sub.amount,
              sub.currency,
              sub.current_period_start&.iso8601,
              sub.current_period_end&.iso8601,
              sub.created_at.iso8601,
            ]
          end
        end

        send_data csv, filename: "subscriptions_#{Date.current}.csv", type: 'text/csv'
      end

      def send_payments_csv
        payments = ::Gamepatch::Payment.includes(:account, :subscription).all

        csv = CSV.generate do |csv|
          csv << %w(id account_username mollie_id status amount currency payment_method paid_at created_at)
          payments.each do |payment|
            csv << [
              payment.id,
              payment.account&.username,
              payment.mollie_payment_id,
              payment.status,
              payment.amount,
              payment.currency,
              payment.payment_method,
              payment.paid_at&.iso8601,
              payment.created_at.iso8601,
            ]
          end
        end

        send_data csv, filename: "payments_#{Date.current}.csv", type: 'text/csv'
      end

      def send_revenue_csv
        # Monthly revenue breakdown
        data = ::Gamepatch::Payment.paid
                                   .group("date_trunc('month', paid_at)")
                                   .sum(:amount)

        csv = CSV.generate do |csv|
          csv << %w(month revenue currency)
          data.sort.each do |month, amount|
            csv << [month&.strftime('%Y-%m'), amount, 'EUR']
          end
        end

        send_data csv, filename: "revenue_#{Date.current}.csv", type: 'text/csv'
      end
    end
  end
end
