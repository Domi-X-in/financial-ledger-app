// client/src/components/Ledger/TransactionGraphs.js
import React, { useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { formatDate, formatCurrency } from "../../utils/helpers";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TransactionGraphs = ({ transactions, currency }) => {
  const [chartType, setChartType] = useState("line");

  if (transactions.length === 0) {
    return (
      <div className="card">No transaction data available for charts.</div>
    );
  }

  // Prepare data for charts
  const dates = transactions.map((t) => formatDate(t.date));
  const amounts = transactions.map((t) => t.amount);
  const balances = transactions.map((t) => t.balance);

  // Group transactions by month for pie chart
  const monthlyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const monthYear = `${date.toLocaleString("default", {
      month: "short",
    })}-${date.getFullYear()}`;

    if (!acc[monthYear]) {
      acc[monthYear] = 0;
    }

    acc[monthYear] += t.amount;
    return acc;
  }, {});

  // Line chart data
  const lineData = {
    labels: dates,
    datasets: [
      {
        label: "Balance",
        data: balances,
        borderColor: "#FF0000",
        backgroundColor: "rgba(255, 0, 0, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Bar chart data
  const barData = {
    labels: dates,
    datasets: [
      {
        label: "Transactions",
        data: amounts,
        backgroundColor: amounts.map((amount) =>
          amount >= 0 ? "rgba(52, 199, 89, 0.7)" : "rgba(255, 59, 48, 0.7)"
        ),
        borderColor: amounts.map((amount) =>
          amount >= 0 ? "rgb(52, 199, 89)" : "rgb(255, 59, 48)"
        ),
        borderWidth: 1,
      },
    ],
  };

  // Pie chart data
  const pieData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        data: Object.values(monthlyData),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text:
          chartType === "line"
            ? "Balance Over Time"
            : chartType === "bar"
            ? "Transaction Amounts"
            : "Transactions by Month",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y, currency);
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div className="transaction-graphs">
      <div className="chart-selector mb-3">
        <button
          className={`btn ${chartType === "line" ? "" : "btn-secondary"} mr-2`}
          onClick={() => setChartType("line")}
          style={{ marginRight: "10px" }}
        >
          Line Chart
        </button>
        <button
          className={`btn ${chartType === "bar" ? "" : "btn-secondary"} mr-2`}
          onClick={() => setChartType("bar")}
          style={{ marginRight: "10px" }}
        >
          Bar Chart
        </button>
        <button
          className={`btn ${chartType === "pie" ? "" : "btn-secondary"}`}
          onClick={() => setChartType("pie")}
        >
          Pie Chart
        </button>
      </div>

      <div className="graph-container">
        {chartType === "line" && <Line data={lineData} options={options} />}
        {chartType === "bar" && <Bar data={barData} options={options} />}
        {chartType === "pie" && <Pie data={pieData} options={options} />}
      </div>
    </div>
  );
};

export default TransactionGraphs;
