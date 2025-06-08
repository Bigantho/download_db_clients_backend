import users from "./users.mjs";
import messages_sent from "./messages_sent.mjs";
import restricted_phone from './restricted_phones.mjs'
import executed_queries from "./executed_queries.mjs";
// states.associate()
users.associate()
messages_sent.associate()
executed_queries.associate()
export {
  users,
  messages_sent,
  restricted_phone,
  executed_queries
  
} 