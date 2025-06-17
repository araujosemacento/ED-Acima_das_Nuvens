from js import document  # type: ignore


def process_input(event):
    input_text = document.querySelector("#teste")
    output_div = document.querySelector("#output")
    output_div.innerText = input_text.value
