export function log(out, message) {
    out('[' + (new Date()) + '] ' + message)
}

export function log_info(message) {
    log(console.log, '[INFO] ' + message)
}

export function log_err(message) {
    log(console.error, '[ERROR] ' + message)
}
