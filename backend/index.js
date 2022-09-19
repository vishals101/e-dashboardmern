const express = require('express');
const cors = require("cors");
// const mongoose = require('mongoose');
require('./db/config');
const User = require("./db/User")
const Product = require("./db/Product")

const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm'


const app = express();
app.use(cors());
// const connectDB = async () =>{
//     mongoose.connect('mongodb://localhost:27017/e-commerce');
//     const productSchema = new mongoose.Schema({});
//     const product = mongoose.model('product',productSchema);
//     const data = await product.find();
//     console.warn('mydata',data);
// }
// connectDB();

app.get("/", (req, resp) => {
    resp.send("app is working...")
});
app.use(express.json())
app.post("/register", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password
    // resp.send(result)
    Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            resp.send({ result: "something went wrong, Please try after sometime" })
        }
        resp.send({ result, auth: token })
    })
})

app.post("/login", async (req, resp) => {
    console.log('request send', req.body);

    if (req.body.email && req.body.password) {
        let user = await User.findOne(req.body).select("-password")
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "something went wrong, Please try after sometime" })
                }
                resp.send({ user, auth: token })
            })
            //resp.send(user)
        } else {
            resp.send({ result: "No user found" })
        }

    } else {
        resp.send({ result: "No user found" })
    }

    // resp.send(user);
})

app.post("/add-product",verifyToken, async (req, resp) => {
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result)
})

app.get("/products", async (req, resp) => {
    let products = await Product.find();
    if (products.length > 0) {
        resp.send(products)

    } else {
        resp.send({ result: "No Product found" });
    }

})

app.delete("/delete/:id",verifyToken, async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id })
    resp.send(result)
})

app.get("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send(result)
    } else {
        resp.send({ result: "No Record found" })
    }
})

app.put("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    if (result) {
        resp.send(result)
    } else {
        resp.send({ result: "No Record found" })
    }
})

app.get("/search/:key", verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } }
        ]
    });
    resp.send(result)
})

function verifyToken(req, resp, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        console.log("middleware called if", token);
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                resp.status(401).send({result:"please provide valid token "});
            }else{
                next();
            }
        })
    } else {
        resp.status(403).send({result:"please add token with header"});
    }
    
}

app.listen(5000)