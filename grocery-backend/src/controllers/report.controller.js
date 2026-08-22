import Bill from "../models/bill.model.js";
import Expense from "../models/expense.model.js";

export const getReport = async (req, res) => {
  try {
    const { period = "6months" } = req.query;

    const now = new Date();

    /*
        ============================================================
        1. DATE RANGE
        ============================================================
        */

    let startDate;

    switch (period) {
      case "today": {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        break;
      }

      case "7days": {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        startDate.setDate(startDate.getDate() - 6);

        break;
      }

      case "30days": {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        startDate.setDate(startDate.getDate() - 29);

        break;
      }

      case "3months": {
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        break;
      }

      case "6months": {
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        break;
      }

      case "1year": {
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);

        break;
      }

      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid period. Use today, 7days, 30days, 3months, 6months or 1year.",
        });
    }

    /*
        ============================================================
        2. FETCH BILLS
        ============================================================
        */

    const bills = await Bill.find({
      createdAt: {
        $gte: startDate,
        $lte: now,
      },
    }).lean();

    /*
        ============================================================
        3. FETCH EXPENSES
        ============================================================
        */

    const expensesData = await Expense.find({
      createdAt: {
        $gte: startDate,
        $lte: now,
      },
    }).lean();

    /*
        ============================================================
        4. SUMMARY
        ============================================================

        Revenue:
            quantity × sellingPrice

        Cost of Goods Sold:
            quantity × costPrice

        Gross Profit:
            Revenue - COGS

        Gross Profit Margin:
            Gross Profit / Revenue × 100

        Expenses:
            Separate business expenses

        Net Profit:
            Gross Profit - Expenses
        ============================================================
        */

    let revenue = 0;
    let costOfGoodsSold = 0;
    let expenses = 0;

    /*
        -------------------------
        REVENUE + COGS
        -------------------------
        */

    bills.forEach((bill) => {
      if (!Array.isArray(bill.items)) {
        return;
      }

      bill.items.forEach((item) => {
        const quantity = Number(item.quantity) || 0;

        const sellingPrice = Number(item.sellingprice) || 0;

        const costPrice = Number(item.costprice) || 0;

        revenue += quantity * sellingPrice;

        costOfGoodsSold += quantity * costPrice;
      });
    });

    /*
        -------------------------
        EXPENSES
        -------------------------
        */

    expensesData.forEach((expense) => {
      expenses += Number(expense.amount) || 0;
    });

    /*
        -------------------------
        GROSS PROFIT
        -------------------------
        */

    const grossProfit = revenue - costOfGoodsSold;

    /*
        -------------------------
        GROSS PROFIT MARGIN
        -------------------------
        */

    const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    /*
        -------------------------
        NET PROFIT
        -------------------------
        */

    const netProfit = grossProfit - expenses;

    /*
        ============================================================
        5. REVENUE VS EXPENSES
        ============================================================
        */

    const monthlyMap = new Map();

    /*
        -------------------------
        REVENUE BY MONTH
        -------------------------
        */

    bills.forEach((bill) => {
      const date = new Date(bill.createdAt);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const key = `${year}-${month}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year,
          month,
          revenue: 0,
          expenses: 0,
        });
      }

      const monthData = monthlyMap.get(key);

      if (Array.isArray(bill.items)) {
        bill.items.forEach((item) => {
          const quantity = Number(item.quantity) || 0;

          const sellingPrice = Number(item.sellingprice) || 0;

          monthData.revenue += quantity * sellingPrice;
        });
      }
    });

    /*
        -------------------------
        EXPENSES BY MONTH
        -------------------------
        */

    expensesData.forEach((expense) => {
      const date = new Date(expense.createdAt);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const key = `${year}-${month}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year,
          month,
          revenue: 0,
          expenses: 0,
        });
      }

      const monthData = monthlyMap.get(key);

      monthData.expenses += Number(expense.amount) || 0;
    });

    /*
        -------------------------
        SORT MONTHS
        -------------------------
        */

    const revenueVsExpenses = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }

      return a.month - b.month;
    });

    /*
        ============================================================
        6. SALES BY PAYMENT METHOD
        ============================================================
        */

    const paymentMap = new Map();

    bills.forEach((bill) => {
      const paymentMethod = bill.paymentMethod || "Unknown";

      let billRevenue = 0;

      if (Array.isArray(bill.items)) {
        bill.items.forEach((item) => {
          const quantity = Number(item.quantity) || 0;

          const sellingPrice = Number(item.sellingprice) || 0;

          billRevenue += quantity * sellingPrice;
        });
      }

      if (!paymentMap.has(paymentMethod)) {
        paymentMap.set(paymentMethod, 0);
      }

      paymentMap.set(
        paymentMethod,
        paymentMap.get(paymentMethod) + billRevenue,
      );
    });

    const salesByPaymentMethod = Array.from(paymentMap.entries()).map(
      ([paymentMethod, amount]) => ({
        paymentMethod,
        amount,
      }),
    );

   /*
============================================================
7. SALES OVER TIME
============================================================

Chart granularity depends on selected period:

today   -> hourly
7days   -> daily
30days  -> daily
3months -> monthly
6months -> monthly
1year   -> monthly

Every bucket is created even when sales = 0.
============================================================
*/

let salesOverTime = [];


/*
============================================================
TODAY
============================================================
*/

if (period === "today") {
  const hourlySalesMap = new Map();

  // Create all 24 hours
  for (let hour = 0; hour < 24; hour++) {
    hourlySalesMap.set(hour, {
      hour,
      sales: 0,
    });
  }

  /*
  -------------------------
  ADD SALES
  -------------------------
  */

  bills.forEach((bill) => {
    const date = new Date(bill.createdAt);

    const hour = date.getHours();

    let billRevenue = 0;

    if (Array.isArray(bill.items)) {
      bill.items.forEach((item) => {
        const quantity =
          Number(item.quantity) || 0;

        const sellingPrice =
          Number(item.sellingprice) || 0;

        billRevenue +=
          quantity * sellingPrice;
      });
    }

    hourlySalesMap.get(hour).sales +=
      billRevenue;
  });

  salesOverTime =
    Array.from(hourlySalesMap.values());
}


/*
============================================================
7 DAYS
============================================================
*/

else if (period === "7days") {
  const dailySalesMap = new Map();

  /*
  -------------------------
  CREATE 7 DAYS
  -------------------------
  */

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);

    date.setDate(
      date.getDate() - i
    );

    date.setHours(
      0,
      0,
      0,
      0
    );

    const key =
      `${date.getFullYear()}-` +
      `${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-` +
      `${String(
        date.getDate()
      ).padStart(2, "0")}`;

    dailySalesMap.set(key, {
      date: key,
      sales: 0,
    });
  }

  /*
  -------------------------
  ADD SALES
  -------------------------
  */

  bills.forEach((bill) => {
    const date =
      new Date(bill.createdAt);

    const key =
      `${date.getFullYear()}-` +
      `${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-` +
      `${String(
        date.getDate()
      ).padStart(2, "0")}`;

    if (!dailySalesMap.has(key)) {
      return;
    }

    let billRevenue = 0;

    if (Array.isArray(bill.items)) {
      bill.items.forEach((item) => {
        const quantity =
          Number(item.quantity) || 0;

        const sellingPrice =
          Number(item.sellingprice) || 0;

        billRevenue +=
          quantity * sellingPrice;
      });
    }

    dailySalesMap.get(key).sales +=
      billRevenue;
  });

  salesOverTime =
    Array.from(
      dailySalesMap.values()
    );
}


/*
============================================================
30 DAYS
============================================================
*/

else if (period === "30days") {
  const dailySalesMap = new Map();

  /*
  -------------------------
  CREATE 30 DAYS
  -------------------------
  */

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);

    date.setDate(
      date.getDate() - i
    );

    date.setHours(
      0,
      0,
      0,
      0
    );

    const key =
      `${date.getFullYear()}-` +
      `${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-` +
      `${String(
        date.getDate()
      ).padStart(2, "0")}`;

    dailySalesMap.set(key, {
      date: key,
      sales: 0,
    });
  }

  /*
  -------------------------
  ADD SALES
  -------------------------
  */

  bills.forEach((bill) => {
    const date =
      new Date(bill.createdAt);

    const key =
      `${date.getFullYear()}-` +
      `${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-` +
      `${String(
        date.getDate()
      ).padStart(2, "0")}`;

    if (!dailySalesMap.has(key)) {
      return;
    }

    let billRevenue = 0;

    if (Array.isArray(bill.items)) {
      bill.items.forEach((item) => {
        const quantity =
          Number(item.quantity) || 0;

        const sellingPrice =
          Number(item.sellingprice) || 0;

        billRevenue +=
          quantity * sellingPrice;
      });
    }

    dailySalesMap.get(key).sales +=
      billRevenue;
  });

  salesOverTime =
    Array.from(
      dailySalesMap.values()
    );
}


/*
============================================================
3 MONTHS / 6 MONTHS / 1 YEAR
============================================================

Use monthly aggregation because hundreds of
daily points make the chart unnecessarily noisy.
============================================================
*/

else {
  const monthlySalesMap = new Map();

  /*
  -------------------------
  DETERMINE NUMBER OF MONTHS
  -------------------------
  */

  let numberOfMonths;

  switch (period) {
    case "3months":
      numberOfMonths = 3;
      break;

    case "6months":
      numberOfMonths = 6;
      break;

    case "1year":
      numberOfMonths = 12;
      break;

    default:
      numberOfMonths = 6;
  }


  /*
  -------------------------
  CREATE MONTH BUCKETS
  -------------------------
  */

  for (
    let i = numberOfMonths - 1;
    i >= 0;
    i--
  ) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    const year =
      date.getFullYear();

    const month =
      date.getMonth() + 1;

    const key =
      `${year}-${String(
        month
      ).padStart(2, "0")}`;

    monthlySalesMap.set(key, {
      year,
      month,
      date: key,
      sales: 0,
    });
  }


  /*
  -------------------------
  ADD SALES
  -------------------------
  */

  bills.forEach((bill) => {
    const date =
      new Date(bill.createdAt);

    const year =
      date.getFullYear();

    const month =
      date.getMonth() + 1;

    const key =
      `${year}-${String(
        month
      ).padStart(2, "0")}`;

    if (!monthlySalesMap.has(key)) {
      return;
    }

    let billRevenue = 0;

    if (Array.isArray(bill.items)) {
      bill.items.forEach((item) => {
        const quantity =
          Number(item.quantity) || 0;

        const sellingPrice =
          Number(item.sellingprice) || 0;

        billRevenue +=
          quantity * sellingPrice;
      });
    }

    monthlySalesMap.get(key).sales +=
      billRevenue;
  });


  /*
  -------------------------
  SORT MONTHS
  -------------------------
  */

  salesOverTime =
    Array.from(
      monthlySalesMap.values()
    );
}

    /*
============================================================
8. BEST SELLING PRODUCTS
============================================================

We don't fetch Product.

Product name is taken directly from:
    bill.items[].productName

We return:
    productId
    productName
    units
    revenue
    cost
    profit
============================================================
*/

    const productMap = new Map();

    bills.forEach((bill) => {
      if (!Array.isArray(bill.items)) {
        return;
      }

      bill.items.forEach((item) => {
        const productId = item.product?.toString();

        if (!productId) {
          return;
        }

        const productName = item.productName || "Unknown Product";

        const quantity = Number(item.quantity) || 0;

        const sellingPrice = Number(item.sellingprice) || 0;

        const costPrice = Number(item.costprice) || 0;

        const itemRevenue = quantity * sellingPrice;

        const itemCost = quantity * costPrice;

        const itemProfit = itemRevenue - itemCost;

        /*
        -----------------------------------------
        CREATE PRODUCT ENTRY
        -----------------------------------------
        */

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            productId,
            productName,
            units: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          });
        }

        /*
        -----------------------------------------
        UPDATE PRODUCT TOTALS
        -----------------------------------------
        */

        const productData = productMap.get(productId);

        productData.units += quantity;

        productData.revenue += itemRevenue;

        productData.cost += itemCost;

        productData.profit += itemProfit;
      });
    });

    /*
-------------------------
TOP 5 PRODUCTS
-------------------------
*/

    const bestSellingProducts = Array.from(productMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    /*
        ============================================================
        9. RESPONSE
        ============================================================
        */

    return res.status(200).json({
      success: true,

      period,

      dateRange: {
        startDate,
        endDate: now,
      },

      summary: {
        revenue,
        costOfGoodsSold,
        grossProfit,
        profitMargin,
        expenses,
        netProfit,
      },

      revenueVsExpenses,

      salesByPaymentMethod,

      salesOverTime,

      bestSellingProducts,
    });
  } catch (error) {
    console.error("Report Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message,
    });
  }
};
