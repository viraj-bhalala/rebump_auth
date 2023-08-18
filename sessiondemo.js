const express = require('express');
const session = require('express-session');
const app = express();

const PORT = 5000;

app.use(session({
    secret: "secret_key",
    resave: true,
    saveUninitialized: true
}));

app.get("/", function(req, res){
    req.session.userName = 'Viraj';

    console.log(req.session.key)
 
    res.send("Thanks for visiting");
});

app.get('/login', function(req, res){
    var username = req.session.userName;
    res.send(username)
})

app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
});