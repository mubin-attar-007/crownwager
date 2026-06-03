from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self) -> None:
        # Register the post_save signal that auto-creates a Profile for each User.
        from . import signals  # noqa: F401
