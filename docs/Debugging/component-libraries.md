---
title: Component Libraries
---
# Component Libraries

If you are working on custom component libraries you can define them in the launch.json file. The extension will automatically zip and statically host your component libraries. The library folder(s) can ether be in your project or in another workspace on your machine.

`launch.json` configuration options:

- `componentLibraries`: This field takes an array of library configuration objects allowing you to work on more than one library at a time. For the examples, there will only be one library configured but you can simply add more if you need to. Each object in the `componentLibraries` field requires three values.
  - `rootDir`: This is the relative path to the libraries source code. Since this is a relative path your library source does not need to be in the same work space.
  - `outFile`: The name of the zip file that your channel code will download as a component library. You can use values in your outFile string such as `${title}` to be inferred from the libraries manifest file.
  - `files`: A file path or file glob that should be copied to the deployment package.
- `componentLibrariesPort`: Port to access component libraries. Default: `8080`s

## Example:

- .vscode
  - launch.json
- manifest
- components/
  - HomeScene.brs
  - HomeScene.xml
- source/
  - main.brs
- customLibrary
  - manifest
  - components/
    - CustomButton.brs
    - CustomButton.xml
    - CustomTextInput.brs
    - CustomTextInput.xml

Here's a sample launch.json for this scenario:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "brightscript",
            ...
            "rootDir": "${workspaceFolder}",
            "files": [
                "manifest",
                "source/**/*.*",
                "components/**/*.*"
            ],
            "componentLibraries": [
                {
                    "rootDir": "${workspaceFolder}/customLibrary/",
                    "outFile": "customLibrary.zip",
                    "files": [
                        "manifest",
                        "components/**/*.*"
                    ]
                }
            ]
        }
    ]
}

```
