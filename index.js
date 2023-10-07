import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url))
const port = 3000;
app.set("view engine", "ejs"); // Adăugăm configurarea pentru EJS

app.use(session({
    secret: '....', // Cheia secretă utilizată pentru a semna cookie-urile de sesiune
    resave: false,
    saveUninitialized: true,
  }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public','html')));
app.use(express.static("public"));

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "....",
    database:"....",
    multipleStatements: true
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });


app.get("/", (req, res)=>{
    if(req.session.authenticated){
        res.render("index.ejs", {loggedIn: true})
    }else{
        res.render("index.ejs", { loggedIn: false });
    }
})

app.post("/selectFlight", (req, res)=>{
    const placeDepart = req.body.inputFrom;
    const placeArrival = req.body.inputTo;
    const dateDepart = req.body.depart;
    const dateArrival = req.body.return;
    if(dateDepart === "" || dateArrival===""){
        const sql = "SELECT * FROM flight WHERE takeoff_location = ? AND destination = ?";
        con.query(sql, [placeDepart, placeArrival], function(err, result) {
            if (err) {
                console.error("Error querying MySQL:", err);
                return;
            }
            res.render("selectFlight.ejs", {flights:result})
        });
    }else if(placeDepart === "" || placeArrival=== ""){
        const sql = "SELECT * FROM flight WHERE date_depart = ? AND date_arrival = ?";
        con.query(sql, [dateDepart, dateArrival], function(err, result) {
            if (err) {
                console.error("Error querying MySQL:", err);
                return;
            }
            res.render("selectFlight.ejs", {flights:result})
        });
    }else{
        const sql = "SELECT * FROM flight WHERE date_depart = ? AND date_arrival = ? and takeoff_location = ? AND destination = ?";
        con.query(sql, [dateDepart, dateArrival, placeDepart, placeArrival], function(err, result) {
            if (err) {
                console.error("Error querying MySQL:", err);
                return;
            }
            res.render("selectFlight.ejs", {flights:result})
        });
    }
})

app.get("/flights", (req, res)=>{
    const sql = "SELECT * FROM flight";
    con.query(sql, function(err, result) {
        if (err) {
            console.error("Error querying MySQL:", err);
            return;
        }
        res.render("flights.ejs", {flights:result})
    });
})


app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, 'public','html', 'register.html'))
})

app.post("/register", async (req, res) => {
    const {name, email, password} = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10)

    const sql = 'INSERT into acc values(null, ?, ?, ?)';
    con.query(sql, [name, email, hashedPassword], (err, result) => {
        if (err) {
          console.error('Eroare la înregistrare:', err);
          res.status(500).json({ error: 'Eroare la înregistrare' });

        } else {
            console.log('Utilizator înregistrat cu succes');
            res.redirect('/login');
        }
      });
})

app.get("/login",(req, res)=>{
    res.sendFile(path.join(__dirname, 'public','html', 'login.html'))
})

app.post("/login", (req, res) => {
    const {email, password} = req.body;
    console.log(email, password)

    const sql = "SELECT * FROM acc WHERE email = ?";
    con.query(sql, [email], (err, result) => {

        if(err){
            console.error('Eroare la interogarea bazei de date:', err);
            return res.status(500).send('Eroare la autentificare');
        }
        if(result.length === 0){
            return res.status(401).send('Email-ul nu există.');
        }
        const user = result[0];

        bcrypt.compare(password, user.passw, (bcryptErr, bcryptResult) => {
            if (bcryptErr || !bcryptResult) {
                return res.status(401).send('Parolă incorectă.');
            }
            req.session.authenticated = true;
            res.redirect("/")
        });
    })
})

app.get("/logout", (req, res) => {
    req.session.destroy((err) => { //destroy() - elimina si variabila "authenticated"
        if (err) {
            console.error('Eroare la deautentificare:', err);
        } else {
            res.redirect("/");
        }
    });
});


app.listen(port, ()=>{
    console.log(`Running on port ${port}`)
})
