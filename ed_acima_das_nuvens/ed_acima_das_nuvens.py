import reflex as rx
from rxconfig import config


class State(rx.State):
    count: int = 0

    def increment(self):
        self.count += 1

    def decrement(self):
        self.count -= 1


def index() -> rx.Component:
    return rx.container(
        rx.color_mode.button(position="top-right"),
        rx.hstack(
        rx.button(
            "Decrement",
            color_scheme="ruby",
            on_click=State.decrement,
        ),
        rx.heading(State.count, font_size="2em"),
        rx.button(
            "Increment",
            color_scheme="grass",
            on_click=State.increment,
        ),
        spacing="4",
        justify="center",
    ),
        class_name="h-screen justify-center",
    ),


app = rx.App()
app.add_page(index)
