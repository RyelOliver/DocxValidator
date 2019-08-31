# docx
Debug, validate and diff .docx files.

* Debug a .docx file by copying its contents into an unzipped folder of formatted XML.
* Validate a .docx file.
* Diff two .docx files by file or by line within each file.

## Installation

Use `npm i -g .` to install the package globally so that the CLI can be used.

## CLI

`docx debug /home/user/Documents/File.docx`
`docx validate /home/user/Documents/File.docx`
`docx diff /home/user/Documents/Old.docx /home/user/Documents/New.docx`