const express = require("express"),
  app = express();
require("dotenv").config();
//Incorporamos sha256
const sha256 = require("sha256");
// Incorporamos express session
session = require("express-session");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const nunjucks = require("nunjucks");

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.use(
  session({
    secret: process.env.SECRETSESSION || "string-supersecreto-nuncavisto-jamas",
    name: "sessionId",
    proxy: true,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 1000 },
  })
);

const MongoClient = require("mongodb").MongoClient;
const MONGO_URL = process.env.MONGOURL || "mongodb://localhost:27017/proyectos";
const dbdata = { db: "proyectos", book: "libros", user: "usuarios" };

app.get("/", (req, res) => {
  res.render("index.html");
});

app.all("/login", function (req, res) {
  if (req.session) {
    MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
      const dbo = db.db(dbdata.db);

      dbo
        .collection(dbdata.user)
        .findOne({ password: req.body.password }, (err, user) => {
          res.render("login.html", { user: user });
        });
    });
  } else {
    if (!req.body.user) {
      res.send("Login failed");
    } else {
      MongoClient.connect(
        MONGO_URL,
        { useUnifiedTopology: true },
        (err, db) => {
          const dbo = db.db(dbdata.db);

          dbo
            .collection(dbdata.user)
            .findOne({ password: req.body.password }, (err, user) => {
              res.render("login.html", { user: user });
            });
        }
      );
    }
  }
});
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.send(
    `Sesion cerrada!</br><p><a href="/">Volver al inicio de sesión</a></p>`
  );
});

app.get("/buscador", (req, res) => {
  var busqueda = req.query.busqueda;
  var expresiontermino = new RegExp(busqueda, "i");
  MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
    const dbo = db.db(dbdata.db);
    dbo
      .collection(dbdata.book)
      .find({ titulo: { $regex: expresiontermino } })
      .toArray(function (err, libros) {
        res.render("buscador.html", { busqueda: busqueda, libros: libros });
      });
  });
});

app.get("/buscaautor", (req, res) => {
  var busqueda = req.query.busqueda;
  var expresiontermino = new RegExp(busqueda, "i");
  MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
    const dbo = db.db(dbdata.db);
    dbo
      .collection(dbdata.book)
      .find({ autor: { $regex: expresiontermino } })
      .toArray(function (err, autor) {
        res.render("buscaautor.html", { busqueda: busqueda, autor: autor });
      });
  });
});

app.all("/altalibros", (req, res) => {
  if (req.body.titulo) {
    MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
      const dbo = db.db(dbdata.db);
      var d = new Date();
      var n = d.getTime();
      dbo.collection(dbdata.book).insertOne(
        {
          ISBN: parseInt(n),
          titulo: req.body.titulo,
          autor: req.body.autor,
          year: parseInt(req.body.year),
          pais: req.body.pais,
          editorial: req.body.editorial,
        },
        function (err, res) {
          db.close();
        }
      );
      res.render("altalibros.html", {
        mensaje: "Alta exitosa de " + req.body.titulo,
      });
    });
  } else {
    res.render("altalibros.html");
  }
});
/*app.all("/altausuario", (req, res) => {
  if (req.body.user) {
    MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
      const dbo = db.db(dbdata.db);
      let d = new Date();
      let n = d.getTime();
      dbo
        .collection(dbdata.user)
        .findOne({ level: { $lte: 5 } }, (err, user) => {
          console.log(user);
          if (user) {
            res.send(
              `No tenes el nivel necesario </br> <p><a href="/">Inicia sesion en otra cuenta</a></p>`
            );
          } else {
            dbo
              .collection(dbdata.user)
              .findOne({ user: req.body.user }, (err, user) => {
                if (user) {
                  res.send(
                    `El usuario ya existe </br><p><a href="/altausuario">Volver al menu anterior</a></p>`
                  );
                } else {
                  dbo.collection(dbdata.user).insertOne(
                    {
                      user: req.body.user,
                      password: sha256(req.body.password),
                      level: parseInt(req.body.level),
                      id: parseInt(n),
                    },
                    function (err, res) {
                      db.close();
                    }
                  );
                  res.render("altausuario.html", {
                    mensaje: "Alta exitosa de " + req.body.user,
                  });
                }
              });
          }
        });
    });
  } else {
    res.render("altausuario.html");
  }
});
*/
app.all("/altausuario", (req, res) => {
  if (req.body.user) {
    MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
      const dbo = db.db(dbdata.db);
      let d = new Date();
      let n = d.getTime();
      dbo
        .collection(dbdata.user)
        .findOne({ level: { $lte: 3 } }, (err, user) => {
          if (user) {
            //console.log(user);
            res.send(
              `No tienes el nivel para dar de alta </br> <p><a href="/">Incia sesión en otra cuenta</a></p>`
            );
          } else {
            dbo
              .collection(dbdata.user)
              .findOne({ user: req.body.user }, (err, user) => {
                if (user) {
                  res.send(
                    `El usuario ya existe </br> <p><a href="/altausuario">Volver al menu anterior</a></p>`
                  );
                } else {
                  dbo.collection(dbdata.user).insertOne(
                    {
                      user: req.body.user,
                      password: sha256(req.body.password),
                      level: parseInt(req.body.level),
                      id: parseInt(n),
                    },
                    function (err, res) {
                      db.close();
                    }
                  );
                  res.render("altausuario.html", {
                    mensaje: "Alta exitosa de " + req.body.user,
                  });
                }
              });
          }
        });
    });
  } else {
    res.render("altausuario.html");
  }
});
app.all("/titulo/:titulo", (req, res) => {
  MongoClient.connect(MONGO_URL, { useUnifiedTopology: true }, (err, db) => {
    const dbo = db.db(dbdata.db);
    var titulo = req.params.titulo;
    //console.log(titulo);
    dbo.collection(dbdata.book).findOne({ titulo: titulo }, (err, libro) => {
      //console.log(libro);
      if (libro) {
        res.render("libro.html", { libro: libro });
      } else {
        res.send("No encontrado");
      }
      db.close();
    });
  });
});
app.listen(process.env.PORT, () => {
  console.log(`Te estucho en el ${process.env.PORT}`);
});
