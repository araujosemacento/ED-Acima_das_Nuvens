from shiny import render, ui
from shiny.express import input
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

ui.panel_title("Hello Shiny!")
ui.input_slider("n", "N", 0, 100, 20)


@render.text
def txt():
    return f"n*2 is {input.n() * 2}"


def maldito_cors():
    routes = ["http://127.0.0.1:*", "http://localhost:*", "https://*.github.io/*"]

    middleware = [Middleware(CORSMiddleware, allow_origins=["*"])]

    app = Starlette(routes=routes, middleware=middleware)  # type: ignore
    return app
