import express from "express";
import dotenv from "dotenv";
import path from "path";
import userRoutes from "./routes/userRoutes.js";
import claimantRoutes from "./routes/claimantRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import connectDB from "./config/db.js";
import cors from "cors";
import bodyParser from 'body-parser';
import stripe from "stripe";
dotenv.config();
connectDB();

const app = express();
const stripeObj = stripe(process.env.SECRET_KEY)
app.use(cors());
app.use(express.json());
const __dirname = path.resolve();
app.use(bodyParser.urlencoded({extended: false}))

app.use(express.static(path.join(__dirname, 'templates/assets')));

app.use("/api/users", userRoutes);
app.use("/api/claimants", claimantRoutes);
app.use("/api/projects", projectRoutes);

app.use(express.static(path.resolve(__dirname, "./dist/ClaimDD-WA")));
// Step 2:
app.get("*", function (request, response) {
  response.sendFile(path.resolve(__dirname, "./dist/ClaimDD-WA", "index.html"));
});

// Stripe Payment

app.post("/payment", (req,res) => {
  console.log("inside payment")
  console.log(req.body)
  stripeObj.customers.create({
    email: req.body.data.name,
    source: req.body.token.id,
    name: req.body.data.name,
    address: {
      line1: 'TC 9/4 Old MES colony',
      postal_code: '841226',
      city: 'South Lizzieside',
      state: 'Illinois',
      country: 'India',
  }
  })
  .then((customer) => {
      return stripeObj.charges.create({
        amount: req.body.data.amount * 100,
        description: 'test payment',
        currency: 'INR',
        customer: customer.id
      })
  })
  .then((charge) => {
    console.log(charge)
    res.status(200);
    res.json({data: "success"})
  })
  .catch((err) => {
    res.status(201)
    res.json({err: err})
  })
})


app.listen(
  process.env.PORT || 5000,
  console.log(`server running on port ${process.env.PORT}`)
);
