# db/migrate/create_preparser_user_and_status_function.rb
class CreatePreparserUserAndStatusFunction < ActiveRecord::Migration[6.0]
  def up
    execute <<-SQL

    SQL
  end

  def down
    execute <<-SQL
      DROP FUNCTION IF EXISTS preParserUserandStatus(JSONB);
    SQL
  end
end