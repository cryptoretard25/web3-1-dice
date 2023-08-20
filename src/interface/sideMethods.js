const convertTimestampToHuman = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const opts = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZone: "UTC",
    hour12: false,
  };

  return date.toLocaleDateString('en-EU', opts)
}

const findEventByTxHash = (events, txhash) => {
  return events.find(event=>{
    return event.transactionHash == txhash;
  })
}


module.exports = { convertTimestampToHuman, findEventByTxHash };