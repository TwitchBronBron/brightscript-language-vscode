# bs_const

If you use `bs_const` in your project manifest you can define separate launch configs in your `launch.json` allowing for easy changing without modifying the manifest yourself. This helps prevent accidentally committing a change to the `bs_consts` in your project. You can not define a constant that is not also in your manifest. See the [manifest constant](https://developer.roku.com/en-ca/docs/references/brightscript/language/conditional-compilation.md#manifest-constant) documentation for more info on their format.

example config:

```json
{
  "type": "brightscript",
  "rootDir": "${workspaceFolder}/dist",
  "host": "192.168.1.2",
  "bsConst": {
    "debug": true,
    "logging": false
  }
}
```
