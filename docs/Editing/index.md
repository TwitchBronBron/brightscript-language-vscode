---
priority: 2
---
# Setup
## Standard
Your project must be structured in the way that Roku expects, which looks something like this:

- manifest
- components/
  - HomeScene.brs
  - HomeScene.xml
- source/
  - main.brs

## Subdirectory
If your project lives in a subdirectory, you will need to create a `bsconfig.json` file at the root of your project, and reference your subdirectory like such:

```json
{
    "rootDir": "./someSubdir"
}
```

This project relies heavily on the [brighterscript](https://github.com/rokucommunity/brighterscript) project for language server support. See [this link](https://github.com/rokucommunity/brighterscript#bsconfigjson-options) to view the `bsconfig.json` options.
