import crypto from "crypto";

import { v4 as uuidv4 } from "uuid";
import { server as WebSocketServer } from "websocket";

import { Game } from "./game";
import { log_info, log_err } from "./logging";

export default class GameServer {
    constructor(http_server) {
        this.http_server = http_server;

        this.running_games = {};
        this.clients = {};
        this.clients_secrets = {};
        this.uuid_to_game = {};
    }

    static check_origin(origin) {
        log_info("Checking origin: " + origin);
        return true;
    }

    start() {
        this.ws_server = new WebSocketServer({
            httpServer: this.http_server,
            autoAcceptConnections: false
        });

        log_info("Websockets server started.");

        this.ws_server.on('request', request => {
            if (!GameServer.check_origin(request.origin)) {
                request.reject();
                log_err('Connection from origin ' + request.origin + ' rejected.');
                return;
            }

            var connection = request.accept('pb-protocol', request.origin);
            log_info('New peer connected from ' + connection.remoteAddress + ' successfully.');

            connection.on('message', message => {
                if (message.type === 'utf8') {
                    log_info('[<-] ' + message.utf8Data);
                    let json_message = JSON.parse(message.utf8Data);

                    let uuid = (json_message.uuid || "").toLowerCase().trim();
                    let slug = (json_message.slug || "").toLowerCase().trim();
                    let action = (json_message.action || "").toLowerCase().trim();

                    if (!action) {
                        log_err("Ignoring action-less message from " + (uuid || "an unknown client") + ".");
                        return;
                    }

                    let uuid_promise = null;

                    // If the user does not have an UUID, we generate one.
                    if (!uuid) {
                        uuid = uuidv4().toLowerCase();
                        let secret = crypto.randomBytes(16).toString("hex");

                        this.clients[uuid] = connection;
                        this.clients_secrets[uuid] = secret;

                        uuid_promise = this.send_message(connection, "set-uuid", {uuid: uuid, secret: secret});
                    }

                    // Else we check the secret.
                    else {
                        if (this.clients_secrets[uuid] !== (json_message.secret || "").trim()) {
                            log_err(`Client with UUID ${uuid} sent a badly authenticated message. Ignored.`);
                            log_err(`Server secret: ${this.clients_secrets[uuid]}`);
                            log_err(`Client secret: ${json_message.secret || ""}`);
                            return;
                        }
                    }

                    (uuid_promise || Promise.resolve()).then(() => {
                        this.handle_message(connection, uuid, this.running_games[slug], action, json_message);
                    });
                }
            });

            connection.on('close', (reasonCode, description) => {
                log_info('Peer ' + connection.remoteAddress + ' disconnected.');

                // We log it out from the game, if any.
                let uuid = this.get_uuid_for_connection(connection);
                let game = this.uuid_to_game[uuid];

                log_info(`Peer had UUID ${uuid} in game ${game ? game.slug : "[N/A]"}.`);

                if (game) {
                    game.left(uuid);
                }
            });
        });
    }

    get_game_for_uuid(uuid) {
        return this.uuid_to_game[uuid];
    }

    get_connection_for_uuid(uuid) {
        return this.clients[uuid];
    }

    get_uuid_for_connection(connection) {
        return Object.keys(this.clients).filter(client_uuid => this.clients[client_uuid] === connection)[0];
    }

    handle_message(connection, user_uuid, game, action, message) {
        switch (action) {
            case "join-game":
                if (game) {
                    this.join_game(connection, user_uuid, message.pseudonym, game);
                }
                else {
                    this.create_game(connection, user_uuid, message.pseudonym);
                }
                break;
            case "update-config":
                if (!game || !message.configuration) return;
                game.update_configuration(connection, user_uuid, message.configuration);
                break;

            case "start-game":
                if (!game) return;
                game.start(connection, user_uuid);

            case "send-answers":
                if (!game || !message.answers) return;
                game.receive_answers(user_uuid, message.answers);

            case "send-vote":
                if (!game || !message.vote || !message.vote.uuid || !message.vote.category) return;
                game.receive_vote(user_uuid, message.vote.category, message.vote.uuid, message.vote.vote);
                break;

            case "vote-ready":
                if (!game) return;
                game.receive_vote_ready(user_uuid);
                break;

            case "restart":
                if (!game) return;
                game.restart(user_uuid);
                break;
        }
    }

    send_message(connection, action, message) {
        return new Promise((resolve, reject) => {
            message.action = action;

            let raw_message = JSON.stringify(message);

            connection.sendUTF(raw_message);

            log_info('[->] ' + raw_message);
            resolve();
        });
    }

    create_game(connection, user_uuid, pseudonym) {
        let slug = crypto.randomBytes(4).toString("hex");
        log_info("Creating game with slug " + slug + " for player " + pseudonym + " (" + user_uuid + ")");

        this.send_message(connection, "set-slug", {slug: slug}).then(() => {
            let game = new Game(slug, this);
            this.join_game(connection, user_uuid, pseudonym, game);

            this.running_games[slug] = game;
        });
    }

    join_game(connection, user_uuid, pseudonym, game) {
        game.join(connection, user_uuid, pseudonym);
        this.uuid_to_game[user_uuid] = game;
    }
}
