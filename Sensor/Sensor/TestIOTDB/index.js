const iotdb = require("iotdb");
iotdb.use("homestar-wemo");

things = iotdb.connect("WeMoSocket");
// things.set(":on", true)
// things.set(":on", false)

// things.on("istate", thing => {
// 	console.log("istate", thing.state("istate"));
// 	console.log("on", thing.get(":on"));
// })
