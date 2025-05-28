// === Actions.js ===
const ACTIONS = {
  HOST_JOIN:      "host-join",      // host creates/enters the room
  REQUEST_JOIN:   "request-join",   // participant asks to join
  JOIN_REQUEST:   "join-request",   // server→host: here's a join request
  APPROVE_JOIN:   "approve-join",   // host approves a request
  REJECT_JOIN:    "reject-join",    // host rejects a request
  JOIN_APPROVED:  "join-approved",  // server→participant: your request was approved
  JOIN_REJECTED:  "join-rejected",  // server→participant: your request was rejected

  JOINED:         "joined",         // server→all: someone has actually joined the room
  DISCONNECTED:   "disconnected",   // server→all: someone left
  CODE_CHANGE:    "code-change",    // code editor sync
  SYNC_CODE:      "sync-code"       // initial code sync
};
module.exports = ACTIONS;
