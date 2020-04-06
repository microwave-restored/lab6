var express = require("express");
var app = express();
const Pool = require("pg").Pool;
const client = new Pool({
  user: "me",
  host: "127.0.0.1",
  database: "students",
  password: "password",
  port: 5432,
  connectionString: "postgresql://postgres:password@127.0.0.1:5432/students"
});
function Connect() {
  if (String(client._clients[0]) === "undefined") client.connect();
  else if (!client._clients[0]._connected) client.connect();
}

async function getAr(dop_quer) {
  Connect();
  var array = [];
  try {
    array = (await client.query("SELECT * FROM tb" + dop_quer)).rows;
  } catch (e) {}
  return array;
}

async function Exists(id) {
  var ar = await getAr(" WHERE id=" + id);
  if ((await getAr(" WHERE id=" + id)).length === 0) return -1;
  else return ar[0];
}

async function setNew(quer) {
  Connect();
  var F = true;
  try {
    await client.query(quer);
  } catch (e) {
    F = false;
  }
  return F;
}
app.get("/students", async function(req, res) {
  var ar = await getAr("");
  res.write("list:\n\n");
  for (let i = 0; i < ar.length; i++)
    res.write(JSON.stringify(ar[i], null, null) + "\n\n");
  res.send();
});
app.get("/tb/:id", async function(req, res) {
  var f = await Exists(req.params.id);
  if (f === -1) res.send("user not found");
  else {
    res.write("Student INFO:\n" + JSON.stringify(f, null, 2));
    res.send();
  }
});
app.delete("/tb/:id", async function(req, res) {
  var id = req.params.id;
  var f = await Exists(id);
  if (f === -1) res.send("user not found");
  else {
    if (await setNew("DELETE FROM tb WHERE id=" + id))
      res.send("student with id" + id + "deleted");
    else res.send("SERVER ERROR!");
  }
});

function check(req) {
  var t = [
      typeof req.query.first_name,
      typeof req.query.last_name,
      typeof req.query.group_name
    ],
    f = [];
  for (var i = 0; i < 3; i++)
    f.push((t[i] !== "undefined") + (t[i] === "object"));
  return f;
}

app.put("/tb/:id", async function(req, res) {
  var id = req.params.id;
  var f = await Exists(id);
  if (f === -1) res.write("user not found");
  else {
    var f2 = check(req);
    var last = [0, 0, 0];
    for (var i = 0; i < 3; i++)
      for (var j = 0; j < 3; j++) last[i] += f2[j] === i;
    if (last[0] === 3) res.write("no data");
    if (last[1] > 0) {
      var quer = "UPDATE tb SET ";
      var z = 0;
      var ar = [
        "first_name='" + req.query.first_name + "'",
        "last_name='" + req.query.last_name + "'",
        "group_name='" + req.query.group_name + "'",
        "updated_at=current_timestamp"
      ];
      for (var t = 0; t <= 3; t++) {
        if (t === 3 || (t < 3 && f2[t] === 1)) {
          if (z === 1) quer += ", ";
          else z = 1;
          quer += ar[t];
        }
      }
      quer += " WHERE id=" + id;
      if (await setNew(quer)) res.write("changed\n");
      else res.write("SERVER ERROR!\n");
    }
    if (last[2] > 0) res.write("eror");
  }
  res.send();
});

app.post("/tb", async function(req, res) {
  var f = check(req);
  switch (f[0] * f[1] * f[2]) {
    case 0:
      res.send("not enough data");
      break;
    case 1:
      var quer = "bI ";
      quer += "(first_name, last_name, group_name, created_at, updated_at) ";
      quer += "VALUES ('" + req.query.first_name + "', ";
      quer += "'" + req.query.last_name + "', '" + req.query.group_name + "', ";
      quer += "current_timestamp, current_timestamp)";
      if (await setNew(quer)) res.send("Done!");
      else res.send("SERVER ERROR! ");
      break;
    default:
      res.send("Not enough data");
  }
});
app.listen(8080);
