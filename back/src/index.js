import http from "http";

import { v4 as uuid } from "uuid";

import GameServer from "./server";
import { log_info, log_err } from "./logging";

const DEBUG = (process.env.NODE_ENV || 'development') != "production";
const SERVER_PORT = 62868;

let server = http.createServer(function(request, response) {
    log_info('Received request for ' + request.url)
    response.writeHead(404)
    response.end()
});
server.listen(SERVER_PORT, function() {
    log_info('Server is listening on port ' + SERVER_PORT + '.');
    let game_server = new GameServer(server);
    game_server.start();
});
