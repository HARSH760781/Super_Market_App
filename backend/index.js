const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const Stripe = require("stripe");
const bcrypt = require("bcrypt");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://online-food-delivery-jxii.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Check if the origin is allowed
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;

//mongodb connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connect to Databse"))
  .catch((err) => console.log(err));

//schema
const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  confirmPassword: String,
  image: String,
});

//
const userModel = mongoose.model("user", userSchema);

//api
app.get("/", (req, res) => {
  res.send("Server is running");
});

//sign up
app.post("/signup", async (req, res) => {
  const { email } = req.body;

  try {
    const result = await userModel.findOne({ email: email });

    if (result) {
      res.send({ message: "Email id is already registered", alert: false });
    } else {
      const data = userModel(req.body);
      const hashpassword = await bcrypt.hash(data.password, 12);
      data.password = hashpassword;
      data.confirmPassword = hashpassword;
      // console.log(data);

      await data.save();
      res.send({ message: "Successfully signed up", alert: true });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});

//api login
app.post("/login", async (req, res) => {
  const { email } = req.body;

  try {
    const result = await userModel.findOne({ email: email });

    if (result) {
      // compare passwords
      const userpassword = req.body.password;
      const compareResult = await bcrypt.compare(userpassword, result.password);
      if (compareResult) {
        const dataSend = {
          _id: result._id,
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          image: result.image,
        };
        res.send({
          message: "Login is successful",
          alert: true,
          data: dataSend,
        });
      } else {
        res.send({
          message: "Something Went Wrong",
          alert: false,
        });
      }
    } else {
      res.send({
        message: "Email is not available, please sign up",
        alert: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});

//product section

const schemaProduct = mongoose.Schema({
  name: String,
  category: {
    type: String,
    index: true,
  },
  image: String,
  price: String,
  description: String,
});
const productModel = mongoose.model("product", schemaProduct);

//save product in data
//api
app.post("/uploadProduct", async (req, res) => {
  const data = await productModel(req.body);
  const datasave = await data.save();
  res.send({ message: "Upload successfully" });
});

app.get("/product", async (req, res) => {
  console.log("Monkey");
  const data = await productModel.find({});
  res.send(JSON.stringify(data));
});
// app.get("/product", async (req, res) => {
//   const page = parseInt(req.query.page) || 1; // Get page number from query parameter
//   const perPage = 10; // Set the number of items per page

//   try {
//     const data = await productModel
//       .find({})
//       .skip((page - 1) * perPage)
//       .limit(perPage);

//     res.json(data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

/*****payment getWay */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
app.post("/create-checkout-session", async (req, res) => {
  try {
    const params = {
      submit_type: "pay",
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      shipping_options: [{ shipping_rate: "shr_1NYWfTSHigsFUrGZeG9y2rYt" }],

      line_items: req.body.map((item) => {
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.name,
            },
            unit_amount: item.price * 100,
          },
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
          },
          quantity: item.qty,
        };
      }),

      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    };

    const session = await stripe.checkout.sessions.create(params);
    res.status(200).json(session.id);
  } catch (err) {
    res.status(err.statusCode || 500).json(err.message);
  }
});

//server is ruuning
app.listen(PORT, () => console.log("server is running at port : " + PORT));
