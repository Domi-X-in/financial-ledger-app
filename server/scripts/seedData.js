// server/scripts/seedData.js
// This script will seed the initial data from the provided table
// Run this after setting up the MongoDB database

const mongoose = require("mongoose");
const User = require("../models/User");
const Ledger = require("../models/Ledger");
const Transaction = require("../models/Transaction");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/ledgerApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Parse date in the format DD-MMM-YY
const parseDate = (dateString) => {
  const [day, month, year] = dateString.split("-");

  // Map three-letter month to number
  const monthMap = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  // Convert 2-digit year to 4-digit year
  const fullYear =
    parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);

  return new Date(fullYear, monthMap[month], parseInt(day));
};

// Clean amount string and convert to number
const parseAmount = (amountString) => {
  // Remove $ and commas, handle parentheses for negative numbers
  if (amountString.startsWith("$(")) {
    const cleanedAmount = amountString.replace(/[$(),]/g, "").trim();
    return -parseFloat(cleanedAmount);
  } else if (amountString.startsWith("$-")) {
    const cleanedAmount = amountString.replace(/[$,]/g, "").trim();
    return parseFloat(cleanedAmount);
  } else {
    const cleanedAmount = amountString.replace(/[$,]/g, "").trim();
    return parseFloat(cleanedAmount);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await Transaction.deleteMany({});
    await Ledger.deleteMany({});
    await User.deleteMany({});

    // Create admin user
    const adminUser = new User({
      name: "Admin User",
      email: "admin@example.com",
      googleId: "admin_google_id",
      role: "admin",
    });

    await adminUser.save();
    console.log("Admin user created");

    // Create ledger owners
    const mingonaOwner = new User({
      name: "Mingona Owner",
      email: "mingona@example.com",
      googleId: "mingona_google_id",
    });

    const rickyOwner = new User({
      name: "Ricky Owner",
      email: "ricky@example.com",
      googleId: "ricky_google_id",
    });

    await mingonaOwner.save();
    await rickyOwner.save();
    console.log("Ledger owners created");

    // Create ledgers
    const mingonaLedger = new Ledger({
      name: "Mingona",
      owner: mingonaOwner._id,
      currency: "USD",
      createdBy: adminUser._id,
    });

    const rickyLedger = new Ledger({
      name: "Ricky",
      owner: rickyOwner._id,
      currency: "USD",
      createdBy: adminUser._id,
    });

    await mingonaLedger.save();
    await rickyLedger.save();
    console.log("Ledgers created");

    // Sample data from the provided table
    const transactionData = [
      {
        date: "15-Jun-20",
        ledger: "Mingona",
        description:
          "Deposito a Cristian por Zelle de Mingona (Desde cuenta de baudo)",
        amount: "$150.00",
        subTotal: "$150.00",
      },
      {
        date: "5-Jul-20",
        ledger: "Mingona",
        description:
          "Deposito a Cristian por Zelle de Mingona (Desde cuenta de loreto leonardo)",
        amount: "$170.00",
        subTotal: "$320.00",
      },
      {
        date: "1-Feb-21",
        ledger: "Mingona",
        description: "Mingona - Pagado a Cristian con Bitcoins",
        amount: "$(320.00)",
        subTotal: "$ 0",
      },
      {
        date: "12-Jul-23",
        ledger: "Mingona",
        description: "Prestamo Inscripciones de los Niños",
        amount: "$-200.00",
        subTotal: "$(200.00)",
      },
      {
        date: "27-Jul-23",
        ledger: "Ricky",
        description: "Ricky Savings 500 USD",
        amount: "$500.00",
        subTotal: "$500.00",
      },
      {
        date: "28-Jul-23",
        ledger: "Ricky",
        description: "Ricky Savings 1000 USD",
        amount: "$1,000.00",
        subTotal: "$1,500.00",
      },
      {
        date: "2-Aug-23",
        ledger: "Ricky",
        description: "Ricky Savings 1500 USD",
        amount: "$1,500.00",
        subTotal: "$3,000.00",
      },
      {
        date: "30-Sep-23",
        ledger: "Mingona",
        description: "Pago",
        amount: "$150.00",
        subTotal: "$(50.00)",
      },
      {
        date: "30-Sep-23",
        ledger: "Mingona",
        description: "Prestamo para Repuestos 190USD",
        amount: "$-190.00",
        subTotal: "$(240.00)",
      },
      {
        date: "1-Nov-23",
        ledger: "Mingona",
        description: "Abono (50 para Gloria)",
        amount: "$50.00",
        subTotal: "$(190.00)",
      },
      {
        date: "15-Nov-23",
        ledger: "Ricky",
        description: "Payment received",
        amount: "$250.00",
        subTotal: "$3,250.00",
      },
      {
        date: "20-Nov-23",
        ledger: "Ricky",
        description: "Payment received",
        amount: "$250.00",
        subTotal: "$3,500.00",
      },
      {
        date: "1-Dec-23",
        ledger: "Mingona",
        description: "Abono (50 para Gloria)",
        amount: "$50.00",
        subTotal: "$(140.00)",
      },
      {
        date: "5-Dec-23",
        ledger: "Ricky",
        description: "500 USDT received in Binance",
        amount: "$500.00",
        subTotal: "$4,000.00",
      },
      {
        date: "4-Dec-23",
        ledger: "Mingona",
        description: "Prestamo para Repuestos 150USD",
        amount: "$-150.00",
        subTotal: "$(290.00)",
      },
      {
        date: "15-Dec-23",
        ledger: "Mingona",
        description: "Abono (200 para Gloria)",
        amount: "$200.00",
        subTotal: "$(90.00)",
      },
      {
        date: "2-Jan-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$4,250.00",
      },
      {
        date: "2-Feb-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-182.00",
        subTotal: "$4,068.00",
      },
      {
        date: "2-Feb-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$4,318.00",
      },
      {
        date: "1-Mar-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$4,568.00",
      },
      {
        date: "1-Mar-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-233.00",
        subTotal: "$4,335.00",
      },
      {
        date: "1-Apr-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-280.00",
        subTotal: "$4,055.00",
      },
      {
        date: "1-Apr-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$4,305.00",
      },
      {
        date: "1-May-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$4,555.00",
      },
      {
        date: "21-May-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-280.00",
        subTotal: "$4,275.00",
      },
      {
        date: "4-Jun-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$4,525.00",
      },
      {
        date: "4-Jun-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-280.00",
        subTotal: "$4,245.00",
      },
      {
        date: "1-Apr-24",
        ledger: "Mingona",
        description: "Abono",
        amount: "$50.00",
        subTotal: "$(40.00)",
      },
      {
        date: "1-May-24",
        ledger: "Mingona",
        description: "Abono",
        amount: "$40.00",
        subTotal: "$0",
      },
      {
        date: "10-May-24",
        ledger: "Mingona",
        description: "Prestamo",
        amount: "$-150.00",
        subTotal: "$(150.00)",
      },
      {
        date: "1-Jul-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-140.00",
        subTotal: "$4,105.00",
      },
      {
        date: "2-Jul-24",
        ledger: "Ricky",
        description: "Payment received (MEXICO)",
        amount: "$706.00",
        subTotal: "$4,811.00",
      },
      {
        date: "10-Jul-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$5,061.00",
      },
      {
        date: "1-Aug-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-140.00",
        subTotal: "$4,921.00",
      },
      {
        date: "12-Aug-24",
        ledger: "Mingona",
        description: "Prestamo",
        amount: "$-150.00",
        subTotal: "$(300.00)",
      },
      {
        date: "31-Aug-24",
        ledger: "Mingona",
        description: "Abono a Prestamo",
        amount: "$100.00",
        subTotal: "$(200.00)",
      },
      {
        date: "3-Sep-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-210.00",
        subTotal: "$4,711.00",
      },
      {
        date: "9-Sep-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$4,961.00",
      },
      {
        date: "1-Oct-24",
        ledger: "Ricky",
        description: "2900 Mx Pagados a Gueard",
        amount: "$145.00",
        subTotal: "$5,106.00",
      },
      {
        date: "2-Oct-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-140.00",
        subTotal: "$4,966.00",
      },
      {
        date: "1-Nov-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-140.00",
        subTotal: "$4,826.00",
      },
      {
        date: "21-Oct-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$5,076.00",
      },
      {
        date: "21-Aug-24",
        ledger: "Mingona",
        description: "Prestamo para Comedor",
        amount: "$-100.00",
        subTotal: "$(300.00)",
      },
      {
        date: "21-Nov-24",
        ledger: "Ricky",
        description: "Payment received (Pranzo Pro Events)",
        amount: "$250.00",
        subTotal: "$5,326.00",
      },
      {
        date: "24-Nov-24",
        ledger: "Ricky",
        description: "Return - Payment received (Pranzo Pro Events)",
        amount: "$-250.00",
        subTotal: "$5,076.00",
      },
      {
        date: "3-Dec-24",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-70.00",
        subTotal: "$5,006.00",
      },
      {
        date: "4-Dec-24",
        ledger: "Mingona",
        description: "Abono a Prestamo -Javier & Coro",
        amount: "$100.00",
        subTotal: "$(200.00)",
      },
      {
        date: "7-Jan-25",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-70.00",
        subTotal: "$4,936.00",
      },
      {
        date: "1-Feb-25",
        ledger: "Ricky",
        description: "Payment to Karina",
        amount: "$-70.00",
        subTotal: "$4,866.00",
      },
      {
        date: "12-Feb-25",
        ledger: "Ricky",
        description: "Zelle Guille (Laptop)",
        amount: "$-1,555.18",
        subTotal: "$3,310.82",
      },
      {
        date: "27-Feb-25",
        ledger: "Ricky",
        description: "Zelle Mingona (Antecedentes Penales)",
        amount: "$-60.00",
        subTotal: "$3,250.82",
      },
      {
        date: "28-Feb-25",
        ledger: "Ricky",
        description: "Zelle Mingona (Antecedentes Penales)",
        amount: "$-20.00",
        subTotal: "$3,230.82",
      },
      {
        date: "6-Mar-25",
        ledger: "Ricky",
        description: "Reintegro excente Laptop",
        amount: "$89.00",
        subTotal: "$3,319.82",
      },
    ];

    // Create transactions
    const transactions = [];
    for (const data of transactionData) {
      const transaction = new Transaction({
        ledger: data.ledger === "Mingona" ? mingonaLedger._id : rickyLedger._id,
        date: parseDate(data.date),
        description: data.description,
        amount: parseAmount(data.amount),
        createdBy: adminUser._id,
      });

      transactions.push(transaction);
    }

    await Transaction.insertMany(transactions);
    console.log(`${transactions.length} transactions created`);

    console.log("Data seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

// Run the seed function
seedData();
