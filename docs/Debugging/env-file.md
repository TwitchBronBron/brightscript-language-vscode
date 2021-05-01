# .env file

If you change your `launch.json` settings regularly, or don't want to check certain values into version control, then another option is to store those values in a `.env` file. Then, reference it in your `launch.json` and use `${env:YOUR_VAR_NAME}` in `launch.json` settings. Here's an example.

```json
//launch.json

{
    "version": "0.2.0",
    "configurations": [
        {
            ...
            "envFile": "${workspaceFolder}/.env",
            "username": "${env:ROKU_USERNAME}",
            "password": "${env:ROKU_PASSWORD}"
            ...
        }
    ]
}
```

```bash
# .env

#the username for the roku
ROKU_USERNAME=rokudev
#the password for the roku
ROKU_PASSWORD=password123
```

This extension uses the [dotenv](https://www.npmjs.com/package/dotenv) npm module for parsing the `.env` files, so see [this link](https://github.com/motdotla/dotenv#rules) for syntax information.
