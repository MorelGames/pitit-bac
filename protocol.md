# Client → Server

## Common fields

These are included in every message (except if specified), and will not be repeated afterwards.

```json
{
    "action": "action-name",
    "uuid": "the-user-assigned-uuid-or-null-to-get-one",
    "secret": "the-user-assigned-secret-or-null-to-get-one",
    "slug": "the-game-slug"
}
```

- If the `uuid` field is `null` or undefined, the server will send a `set-uuid` message.
- If the `secret` field is `null` or undefined or invalid, and the `uuid` field is set, the message will be rejected.

## `join-game`

The client asks to join a game.

```json
{
    "pseudonym": "The requested pseudonym"
}
```

If the `slug` is set, the server will add the player to this game if it exists; creating a new one else (either if the `slug` is `null` or unknown).

Will answer with `set-slug` to set the game slug (if the game exists, it will be the same slug as the one sent), and with one `player-join` for every player in the game (including the client that sent the message).

## `update-config`

The client updates the configuration of the game.

```json
{
    "configuration": {
        "categories": [
            "Category 1",
            "Category 2"
        ],
        "stopOnFirstCompletion": false,
        "turns": 4,
        "time": 180
    }
}
```

If the client is not master, or if the game's state is not `CONFIG`, the update will be ignored and a `config-updated` message will be replied with the previous configuration to reset it.

Else, a `config-updated` message will be broadcasted to the players of the game (excluding the client that sent the message), and the new configuration saved server-side.

## `start-game`

Starts the game.

```json
{}
```

The message will be ignored if the sender is not master.

## `send-answers`

In the active part of a round, sends answers for the current letter.

```json
{
    "answers": {
        "Category 1": "The answer",
        "Category 2": "The answer"
    }
}
```

If `stopOnFirstCompletion` is set to `true`, this will end the current round's active phase.

## `send-vote`

In the voting part of a round, sends a vote on one's answer. `true` to accept the answer; `false` to reject it.

```json
{
    "vote": {
        "uuid": "The UUID of the player who wrote the answer",
        "category": "The voted category",
        "vote": true
    }
}
```

## `vote-ready`

Indicates that the client votes are done and that we can go to the next round. When every logged-in client are ready, the next round starts automatically.

```json
{}
```

## `restart`

During the end screen, the client asks to restart the game.

```json
{}
```

The message will be ignored if the sender is not master, or if we're not in the `FINAL` game state.

# Server → Client

## Common fields

These are included in every message, and will not be repeated afterwards.

```json
{
    "action": "action-name"
}
```

## `set-uuid`

Sets the client's UUID, and a secret for simple auth, to be sent in every subsequent message.

```json
{
    "uuid": "the-user-assigned-uuid",
    "secret": "a-secret-to-authenticate-users"
}
```

## `set-slug`

Sets the game's slug, to be sent in every subsequent message, and to be reflected into the URL / share box.

```json
{
    "slug": "the-game-slug"
}
```

## `player-join`

Indicates that a player joined the game. Also used when a player joins the game to send it all other already-connected players.

```json
{
    "player": {
        "uuid":"8b42a578-5948-4237-8db0-cae73ff16699",
        "pseudonym": "The Pseudonym",
        "ready": true,
        "master": false
    }
}
```

## `player-left`

Indicates that a player left the game.

```json
{
    "player":{
        "uuid":"8b42a578-5948-4237-8db0-cae73ff16699"
    }
}
```

## `config-updated`

Indicates that the game's config has changed.

```json
{
    "configuration": {
        "categories": [
            "Category 1",
            "Category 2"
        ],
        "stopOnFirstCompletion": false,
        "turns": 4,
        "time": 180
    }
}
```

## `round-started`

Indicates that a new round starts. It will end when a `round-ended` message is received.

When received, all players must be marked as non-ready.

```json
{
    "round": 1,
    "letter": "E"
}
```

## `player-ready`

Indicates that a player is ready.

```json
{
    "player": {
        "uuid": "the-user-assigned-uuid"
    }
}
```

## `round-ended`

Indicates that a round just ended.

When this message is received, the client must send its final submissions with `send-answers`, and display a loading screen until `vote-started` is received.

```json
{}
```

## `vote-started`

Indicates that the voting process starts.

```json
{
    "answers": {
        "Category 1": {
            "a-player-uuid": {
              "answer": "This player's answer",
              "votes": {
                  "a-player-uuid": true,
                  "a-player-uuid": true,
                  "a-player-uuid": true,
                  "a-player-uuid": true,
                  "a-player-uuid": true
              },
            }
        }
    },
    "interrupted": "a-player-uuid-or-null"
}
```

In the `answers` object, `answer` is the answer's text, and `votes` contains the initial votes for each player: all values will be `true` if the answer respects the basic rules of the game (i.e. starts with the correct letter, accents and such removed); `false` else.

If the game is set to be interrupted on first completion, `interrupted` will be set to the UUID of the interrupting player. Else, it will be set to `null`.

## `vote-changed`

Indicates that someone updated their vote.

```json
{
    "voter": {
        "uuid": "the-user-assigned-uuid"
    },
    "vote": {
        "uuid": "The UUID of the player who wrote the answer",
        "category": "Category 1",
        "vote": true
    }
}
```

## `game-ended`

Indicates that the game ended and that the client should display the final scores.

```json
{
    "scores": [
        {
            "uuid": "a-player-uuid",
            "score": 243,
            "rank": 1
        },
        {
            "uuid": "a-player-uuid",
            "score": 242,
            "rank": 2
        },
        {
            "uuid": "a-player-uuid",
            "score": 141,
            "rank": 3
        },
    ]
}
```

## `game-restarted`

Indicates that the game is restarted. The client will go back to the configuration screen.

```json
{}
```



# TODO

- Supprimer une partie côté serveur quand elle est vide, après un délai si en `CONFIG`, immédiatement sinon
- Gérer la connexion à n'importe quel moment
- Vérifier que la déconnexion est bien gérée
- Faire l'écran de fin
- Faire la passassion de pouvoir si le master se déconnecte
- Scroll-top quand on change d'écran
- Ajouter un délai avant le début d'une manche
- Indiquer le temps quand le tour est interrompu par le plus rapide
