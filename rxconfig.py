import reflex as rx

config = rx.Config(
    app_name="ed_acima_das_nuvens",
    tailwind={"plugins": ["@tailwindcss/forms", "@tailwindcss/typography"]},
    plugins=[rx.plugins.TailwindV3Plugin()],
    cors_allowed_origins=["http://localhost:3000", "https://araujosemacento.github.io/ED-Acima_das_Nuvens/",],
)