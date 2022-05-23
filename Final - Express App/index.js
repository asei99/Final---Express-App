const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config(); // Harus dipaling atas sebelum code lain jalan, karena Environment Variable bisa tidak terbaca oleh code lain.
const routes = require("./api/router");

const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again in an hour!",
});

const app = express();
const PORT = process.env.PORT || 8000;

app.use(helmet());
app.use(cookieParser());
app.use("/v1/api", limiter);
// app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    credentials: true,
    origin: true,
    // allowedHeaders: ['X-Requested-With', 'X-HTTP-Method-Override', 'Content-Type', 'Accept']
  })
);
app.use(express.json());
app.use(morgan("tiny"));
// app.use([morgan('dev'), verifyToken, logging]);

app.use("/v1/api", routes);
app.all("*", (req, res, next) => {
  return res
    .status(404)
    .json({ status: "fail", message: "Route is not exist!" });
});

app.listen(PORT, () => {
  console.log(`Application is running on PORT: ${PORT}`);
});
