# frozen_string_literal: true

class GamepatchPolicy < ApplicationPolicy
  def index?
    role.can?(:manage_settings)
  end

  def show?
    role.can?(:manage_settings)
  end

  def create?
    role.can?(:manage_settings)
  end

  def update?
    role.can?(:manage_settings)
  end

  def destroy?
    role.can?(:manage_settings)
  end
end
