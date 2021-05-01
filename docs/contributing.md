---
priority: 1001
---
# Contributing

The majority of this extension's language feature support depends on the [BrighterScript](https://github.com/RokuCommunity/brighterscript) project, which contributes the language server. The debugging functionality comes from the [roku-debug](https://github.com/RokuCommunity/roku-debug] project. To get up and running, do the following:

### The easy way
In a terminal, execute 
```bash
npm run install-local
```

This will do the following automatically for you:
 - Clone any missing repositories at the same folder level as this project.
 - Install and build each dependency
 - Update this project's `package.json` to point to the local projects using a relative file scheme (i.e. `"roku-deploy": "file:../roku-deploy"`)
 - delete each dependency's folder in this project's node_modules folder to prevent conflicts.
 - run `npm install` in the root of this project.

 To undo these changes, run 
 ```bash
 npm run uninstall-local
 ```


### The manual way
You only need to install local copies of projects you actually want to work on. You can leave the others as npm modules. This workflow will show the process of installing all projects.

 1. Clone the following projects to the parent folder as this project. (i.e. `C:\projects\vscode-brightscript language`, `C:\projects\brighterscript`, etc...)
    - [brighterscript](https://github.com/RokuCommunity/brighterscript)
    - [brighterscript-formatter](https://github.com/RokuCommunity/brighterscript-formatter)
    - [roku-debug](https://github.com/RokuCommunity/roku-debug)
    - [roku-deploy](https://github.com/RokuCommunity/roku-deploy)

 1. Inside each of the cloned repositories, run  
     ```bash
     npm install && npm run build
     ```
 1. In `vscode-brightscript-language/node_modules`, delete any folders matching the above project names
 1. Open `vscode-brightscript-language/package.json` and edit the `dependencies`to look like this:

    ```js
    {
        "dependencies": {
            //...
            "brighterscript": "file:../brighterscript",
            "brighterscript-formatter": "file:../brighterscript-formatter",
            "roku-debug": "file:../roku-debug",
            "roku-deploy": "file:../roku-debug",
            //...
        }
    }
    ```

 1. In the `vscode-brightscript-language` folder
    ```bash
    npm install && npm run build
    ``` 
 1. You're all set! Open the `vscode-brightscript-language` folder in vscode to start debugging. 

View our [developer guidelines](https://github.com/RokuCommunity/vscode-brightscript-language/blob/master/developer-guidelines.md) for more information on how to contribute to this extension.

You can also chat with us [on slack](http://tiny.cc/nrdf0y). (We're in the #vscode-bs-lang-ext channel).
