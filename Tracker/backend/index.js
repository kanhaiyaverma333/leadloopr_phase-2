const express = require("express");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:9002",
  "http://192.168.1.95:9002",
  "https://yourdomain.com",
];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.includes(origin)) {
//       callback(null, origin);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
// };

// // const corsOptions = {
// //   origin: function (origin, callback) {
// //     if (!origin) return callback(null, false);
// //     callback(null, origin);
// //   },
// //   credentials: true,
// // };

// app.use(cors({
//   origin: 'http://192.168.1.95:9002', // or your frontend domain
//   credentials: true
// }));

app.use(cors());
app.use(express.json());

app.post("/api/user-data", (req, res) => {
  console.log("Data received:", req.body);
  res.status(200).json({ message: "Data received!" });
});

app.post("/api/form-data", (req, res) => {
  console.log("Form Data", req.body);
  try {
    const jsonData = req.body;

    if (jsonData.form_data) {
      const newEntry = {
        ...jsonData.form_data,
        org_id: jsonData.org_id,
        timestamp: new Date().toISOString(),
      };

      let existingData = [];

      if (fs.existsSync("form-data.json")) {
        const fileData = fs.readFileSync("form-data.json", "utf8");
        if (fileData) {
          existingData = JSON.parse(fileData);
        }
      }

      existingData.push(newEntry);

      fs.writeFileSync("form-data.json", JSON.stringify(existingData, null, 2));

      res.status(200).json({ message: "Data appended successfully!" });
    } else {
      res.status(200).json({ message: "No data found!" });
    }
  } catch (error) {
    console.error("Error writing data:", error);
    res.status(500).json({ error: "Failed to write data." });
  }
});

app.get("/api/form-data", async (req, res) => {
  try {
    const filePath = "form-data.json";

    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ formData: [], message: "No data found!" });
    }
    const data = fs.readFileSync("form-data.json", "utf8");
    const jsonData = JSON.parse(data);
    const sortedData = jsonData.reverse();
    res
      .status(200)
      .json({ formData: sortedData, message: "Data fetched successfully!" });
  } catch (error) {
    console.error("Error reading data:", error);
    res.status(500).json({ error: "Failed to read data." });
  }
});

// app.get("/api/form-data/consent", (req, res) => {
//   const value = req.query.value === "true" ? "true" : "false";

//   res.cookie("cookie-consent", value, {
//     httpOnly: true,
//     domain: "192.168.1.48",
//     secure: false,
//     sameSite: "None",
//     path: "/",
//     maxAge: 31536000000,
//   });

//   res.status(200).json({
//     message: `Consent ${value === "true" ? "granted" : "denied"}`,
//     consent: value,
//   });
// });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
1;
