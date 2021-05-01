# SourceMaps

The extension has full support for [source maps](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_a_source_map). Which means that if your preprocessor has source map support then the extension will correctly translate breakpoints from source files into compiled locations and will translate compiled locations back to source locations. In this situation, you would want to set up your launch config like this:

```javascript
//.vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [{
        //this is where your preprocessor puts the final code (including source maps)
        "rootDir": "${workspaceFolder}/dist",
        // run your preprocessor which writes the final code to `${workspaceFolder}/dist` (including source maps)
        "preLaunchTask": "your-build-task-here",
        //...other launch args
    }]
}
```

Your dist folder would look something like this after running your preprocessor.

- \${workspaceFolder}/dist/
  - manifest
  - source/
    - main.brs
    - main.brs.map
  - components/
    - component1.xml
    - component1.xml.map
    - component1.brs
    - component1.brs.map
