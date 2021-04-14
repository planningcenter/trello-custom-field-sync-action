# Trello Custom Field Sync Github Action

Trello Custom Field Sync Github Action helps to keep your Trello board up-to-date with what is happening on github.

## Prerequisites

- You must attach PRs to your trello cards to make this function correctly
- You must have a custom field added to your cards
- Github actions must be enabled for your github repository.

## Basic Usage

In your repository, add a file to run a github action that looks something like this:

```yml
# .github/workflows/trello.yml

name: Trello Syncing (you can name this whatever you want to show in )

on:
  push:
    branches:
      - staging # this can be a different branch.
                # It is not recommended to use more than one branch here
                # unless you use `add_only: true`

jobs:
  sync_trello: # you can change this
    runs-on: ubuntu-latest
    steps:
      - uses: planningcenter/trello-custom-field-sync-action@v0.1.0
        with:
          trello_key: ${{ secrets.TRELLO_KEY }}
          trello_token: ${{ secrets.TRELLO_TOKEN }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          trello_board_id: HI30B6yE # edit to your trello board id
```

## Additional Setup Options

To use these, add them to the list of `with:` key/value pairs.

| key | default | description |
|---| ---| ---|
|__`trello_board_id`(required)__ | none | Id of the board to sync with. Can be found in the URL of the main board: (ex. `trello.com/b/{ID}/your-board-name`) |
|__`trello_custom_field_name`__ | "Environment" | The name of the custom field that will be synced (not the value) |
|__`trello_custom_field_value`__ | "Staging" | The value of the custom field that will be synced. This value must be added to the options for it to work correctly. |
|__`add_only`__ | false | The syncing will remove the custom field value when the attached PR is no longer on the target branch.  Setting this value to try will make it so that the syncing will only add the tag and will not remove it. |

## Setting up secrets

In order to protect your trello key and token, you will need to add them in github to your secrets.

GITHUB_TOKEN is added automatically by Github.

### Generating Trello Key/Token

Go to https://trello.com/app-key.  If you are logged in, you should see your key there.  To get a token, click on `Generate a Token` to get one.

### Adding secrets to Github

On Github, for the repository you are setting up, go to `Settings` -> `Secrets` -> `Actions`.

Click on `New repository secret`.

Create 2 secrets, one for the key with the `Name` of `TRELLO_KEY` and one for the token with the `Name` of `TRELLO_TOKEN`.

## Roadmap

- Sync when branches are attached to a trello card.
- Add support for squash merge detection
- Add testing
