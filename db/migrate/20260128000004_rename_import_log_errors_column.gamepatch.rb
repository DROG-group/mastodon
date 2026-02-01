# frozen_string_literal: true

class RenameImportLogErrorsColumn < ActiveRecord::Migration[7.0]
  # Safe: newly created table with no data
  disable_ddl_transaction!

  def change
    safety_assured { rename_column :gamepatch_import_logs, :errors, :error_details }
  end
end
