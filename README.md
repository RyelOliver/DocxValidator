# DocxValidator
Validate a .docx file.


## Installation

Use `npm i -g .` to install the package globally so that the CLI can be used as follows `docxvalidator /home/user/Documents/File.docx`.


## API

### `validate(file)`

`file`: the .docx file to validate

### `log(error)`

`severity`: if the severity is `Warning`, the error will be warned in yellow, otherwise it will be errored in red
